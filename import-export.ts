import { storage } from "./storage";
import multer from "multer";
import csvParser from "csv-parser";
import * as XLSX from "xlsx";
import { insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
    }
  }
});

// CSV/Excel column mapping for different apps
const COLUMN_MAPPINGS = {
  spendee: {
    date: ['Date', 'date', 'Date Created', 'Created Date'],
    amount: ['Amount', 'amount', 'Value', 'Sum'],
    category: ['Category', 'category', 'Category name'],
    description: ['Note', 'note', 'Description', 'description', 'Comment']
  },
  walnut: {
    date: ['Date', 'Transaction Date', 'date'],
    amount: ['Amount', 'Transaction Amount', 'amount'],
    category: ['Category', 'category'],
    description: ['Description', 'Note', 'description']
  },
  generic: {
    date: ['Date', 'date', 'transaction_date', 'Date Created'],
    amount: ['Amount', 'amount', 'value', 'sum', 'price'],
    category: ['Category', 'category', 'type'],
    description: ['Description', 'description', 'note', 'comment', 'memo']
  }
};

interface ParsedExpense {
  date: string;
  amount: number;
  category: string;
  description: string;
  source: 'import';
}

function findColumnValue(row: any, possibleNames: string[]): string | undefined {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return String(row[name]).trim();
    }
  }
  return undefined;
}

function parseAmount(amountStr: string): number {
  // Remove currency symbols and normalize
  const cleaned = amountStr
    .replace(/[₹$€£,\s]/g, '')
    .replace(/[()]/g, '-') // Handle negative amounts in parentheses
    .trim();
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.abs(amount); // Always use positive amounts
}

function parseDate(dateStr: string): string {
  try {
    // Try different date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    ];
    
    let parsedDate: Date;
    
    if (formats[0].test(dateStr)) {
      // Already in correct format
      parsedDate = new Date(dateStr);
    } else if (formats[1].test(dateStr) || formats[3].test(dateStr)) {
      // MM/DD/YYYY format
      const [month, day, year] = dateStr.split('/');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (formats[2].test(dateStr)) {
      // MM-DD-YYYY format
      const [month, day, year] = dateStr.split('-');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Try native Date parsing
      parsedDate = new Date(dateStr);
    }
    
    if (isNaN(parsedDate.getTime())) {
      // Default to today if parsing fails
      parsedDate = new Date();
    }
    
    // Return in YYYY-MM-DD format
    return parsedDate.toISOString().split('T')[0];
  } catch (error) {
    // Default to today
    return new Date().toISOString().split('T')[0];
  }
}

async function parseCSVData(buffer: Buffer, sourceApp: string = 'generic'): Promise<ParsedExpense[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedExpense[] = [];
    const mapping = COLUMN_MAPPINGS[sourceApp as keyof typeof COLUMN_MAPPINGS] || COLUMN_MAPPINGS.generic;
    
    const stream = require('stream');
    const readable = new stream.Readable();
    readable.push(buffer);
    readable.push(null);
    
    readable
      .pipe(csvParser())
      .on('data', (row: any) => {
        const date = findColumnValue(row, mapping.date);
        const amount = findColumnValue(row, mapping.amount);
        const category = findColumnValue(row, mapping.category);
        const description = findColumnValue(row, mapping.description);
        
        if (date && amount) {
          try {
            const parsedExpense: ParsedExpense = {
              date: parseDate(date),
              amount: parseAmount(amount),
              category: category || 'Other',
              description: description || '',
              source: 'import'
            };
            results.push(parsedExpense);
          } catch (error) {
            console.warn('Failed to parse row:', row, error);
          }
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: any) => {
        reject(error);
      });
  });
}

async function parseExcelData(buffer: Buffer, sourceApp: string = 'generic'): Promise<ParsedExpense[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const mapping = COLUMN_MAPPINGS[sourceApp as keyof typeof COLUMN_MAPPINGS] || COLUMN_MAPPINGS.generic;
  const results: ParsedExpense[] = [];
  
  for (const row of data as any[]) {
    const date = findColumnValue(row, mapping.date);
    const amount = findColumnValue(row, mapping.amount);
    const category = findColumnValue(row, mapping.category);
    const description = findColumnValue(row, mapping.description);
    
    if (date && amount) {
      try {
        const parsedExpense: ParsedExpense = {
          date: parseDate(date),
          amount: parseAmount(amount),
          category: category || 'Other',
          description: description || '',
          source: 'import'
        };
        results.push(parsedExpense);
      } catch (error) {
        console.warn('Failed to parse row:', row, error);
      }
    }
  }
  
  return results;
}

export async function importExpensesFromFile(
  userEmail: string,
  file: Express.Multer.File,
  sourceApp: string = 'generic'
): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  console.log(`📥 Starting import for ${userEmail} from ${sourceApp}`);
  
  // Create import record
  const importRecord = await storage.createDataImport({
    userEmail,
    fileName: file.originalname,
    fileType: file.mimetype.includes('csv') ? 'csv' : 'xlsx',
    sourceApp,
    status: 'processing'
  });
  
  try {
    let expenses: ParsedExpense[];
    
    if (file.mimetype.includes('csv')) {
      expenses = await parseCSVData(file.buffer, sourceApp);
    } else {
      expenses = await parseExcelData(file.buffer, sourceApp);
    }
    
    console.log(`📊 Parsed ${expenses.length} expenses from file`);
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const expense of expenses) {
      try {
        // Validate the expense data
        const validatedExpense = insertExpenseSchema.parse({
          userEmail,
          amount: expense.amount.toString(),
          category: expense.category,
          description: expense.description,
          method: 'import',
          date: new Date(expense.date + 'T12:00:00.000Z') // Set to noon to avoid timezone issues
        });
        
        await storage.createExpense(validatedExpense);
        imported++;
      } catch (error) {
        console.warn('Failed to import expense:', expense, error);
        errors.push(`Failed to import expense on ${expense.date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        skipped++;
      }
    }
    
    // Update import record
    await storage.updateDataImport(importRecord.id, {
      recordsProcessed: expenses.length,
      recordsImported: imported,
      recordsSkipped: skipped,
      status: 'completed',
      errorMessage: errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    });
    
    console.log(`✅ Import completed: ${imported} imported, ${skipped} skipped`);
    
    return { imported, skipped, errors };
  } catch (error) {
    console.error('Import failed:', error);
    
    await storage.updateDataImport(importRecord.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

export async function exportUserDataAsJSON(userEmail: string) {
  const data = await storage.exportUserData(userEmail);
  
  return {
    exportedAt: new Date().toISOString(),
    user: {
      email: data.user.email,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      country: data.user.country,
      createdAt: data.user.createdAt
    },
    expenses: data.expenses.map(expense => ({
      amount: parseFloat(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date.toISOString().split('T')[0],
      method: expense.method,
      createdAt: expense.createdAt
    })),
    budgets: data.budgets.map(budget => ({
      type: budget.type,
      amount: parseFloat(budget.amount),
      categoryBudgets: JSON.parse(budget.categoryBudgets),
      createdAt: budget.createdAt
    })),
    summary: {
      totalExpenses: data.expenses.length,
      totalSpent: data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
      categoriesUsed: [...new Set(data.expenses.map(exp => exp.category))].length,
      dateRange: {
        earliest: data.expenses.length > 0 ? Math.min(...data.expenses.map(exp => exp.date.getTime())) : null,
        latest: data.expenses.length > 0 ? Math.max(...data.expenses.map(exp => exp.date.getTime())) : null
      }
    }
  };
}

export async function exportUserDataAsCSV(userEmail: string) {
  const data = await storage.exportUserData(userEmail);
  
  const csvData = data.expenses.map(expense => ({
    Date: expense.date.toISOString().split('T')[0],
    Amount: parseFloat(expense.amount),
    Category: expense.category,
    Description: expense.description,
    Method: expense.method,
    'Created At': expense.createdAt.toISOString()
  }));
  
  // Simple CSV generation
  if (csvData.length === 0) {
    return 'Date,Amount,Category,Description,Method,Created At\n';
  }
  
  const headers = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

export { upload };