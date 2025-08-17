// Mini reactions system for expenses
export interface CategoryReaction {
  emoji: string;
  message: string;
}

export const categoryReactions: Record<string, CategoryReaction[]> = {
  'Food & Dining': [
    { emoji: '🍔', message: 'Hope it was tasty!' },
    { emoji: '🍕', message: 'Good choice!' },
    { emoji: '☕', message: 'Fuel for the day!' },
    { emoji: '🥗', message: 'Healthy choice!' }
  ],
  'Transport': [
    { emoji: '🚌', message: 'Keep it moving!' },
    { emoji: '🚗', message: 'Safe travels!' },
    { emoji: '🛵', message: 'On the go!' },
    { emoji: '🚇', message: 'Smart commute!' }
  ],
  'Entertainment': [
    { emoji: '🎬', message: 'Enjoy the show!' },
    { emoji: '🎮', message: 'Game on!' },
    { emoji: '🎵', message: 'Music to your ears!' },
    { emoji: '🎪', message: 'Have fun!' }
  ],
  'Shopping': [
    { emoji: '🛍️', message: 'That was fast!' },
    { emoji: '👕', message: 'Looking good!' },
    { emoji: '📱', message: 'Tech upgrade!' },
    { emoji: '💳', message: 'Shopping spree!' }
  ],
  'Groceries': [
    { emoji: '🛒', message: 'Stocking up!' },
    { emoji: '🥕', message: 'Fresh picks!' },
    { emoji: '🍎', message: 'Healthy choices!' },
    { emoji: '🥛', message: 'Essentials covered!' }
  ],
  'Healthcare': [
    { emoji: '💊', message: 'Health first!' },
    { emoji: '🏥', message: 'Taking care!' },
    { emoji: '👩‍⚕️', message: 'Wise investment!' },
    { emoji: '💉', message: 'Stay healthy!' }
  ],
  'Petrol': [
    { emoji: '⛽', message: 'Fuel up!' },
    { emoji: '🚗', message: 'Ready to roll!' },
    { emoji: '💨', message: 'Keep going!' },
    { emoji: '🛣️', message: 'Road ready!' }
  ],
  'Bills & Utilities': [
    { emoji: '💡', message: 'Lights on!' },
    { emoji: '📱', message: 'Connected!' },
    { emoji: '🏠', message: 'Home sweet home!' },
    { emoji: '💰', message: 'Responsibility!' }
  ],
  'Education': [
    { emoji: '📚', message: 'Learning pays!' },
    { emoji: '🎓', message: 'Investing in yourself!' },
    { emoji: '📝', message: 'Knowledge is power!' },
    { emoji: '🧠', message: 'Smart choice!' }
  ],
  'Others': [
    { emoji: '💸', message: 'Every rupee counts!' },
    { emoji: '📊', message: 'Tracking progress!' },
    { emoji: '💪', message: 'You got this!' },
    { emoji: '🎯', message: 'Stay focused!' }
  ]
};

export function getRandomReaction(category: string): CategoryReaction {
  const reactions = categoryReactions[category] || categoryReactions['Others'];
  const randomIndex = Math.floor(Math.random() * reactions.length);
  return reactions[randomIndex];
}

export function getExpenseReaction(amount: number, category: string): CategoryReaction {
  const baseReaction = getRandomReaction(category);
  
  // Add amount-based variations
  if (amount > 1000) {
    return {
      emoji: '💰',
      message: 'Big spend alert! ' + baseReaction.message
    };
  } else if (amount < 50) {
    return {
      emoji: '🪙',
      message: 'Small but smart! ' + baseReaction.message
    };
  }
  
  return baseReaction;
}