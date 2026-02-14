/**
 * FreeMind Icon Utilities
 * Maps FreeMind builtin icon names to emoji representations
 */

/**
 * Icon name to emoji mapping
 * Based on FreeMind's standard icon set
 */
export const ICON_MAP: Record<string, string> = {
  // Status & Actions
  'help': '❓',
  'yes': '✅',
  'button_ok': '✅',
  'button_cancel': '❌',
  'info': 'ℹ️',
  'messagebox_warning': '⚠️',
  'stop': '🛑',
  'stop-sign': '🛑',
  'go': '🟢',
  
  // Ideas & Thinking
  'idea': '💡',
  'wizard': '🪄',
  'prepare': '📋',
  'launch': '🚀',
  
  // Communication
  'Mail': '✉️',
  'kmail': '✉️',
  'korn': '📬',
  'kaddressbook': '📞',
  'bookmark': '🔖',
  'attach': '📎',
  
  // Time
  'calendar': '📅',
  'clock': '⏰',
  'clock2': '⏰',
  'hourglass': '⏳',
  
  // Places & Navigation
  'gohome': '🏠',
  'folder': '📁',
  'back': '◀️',
  'forward': '▶️',
  'up': '⬆️',
  'down': '⬇️',
  
  // Objects
  'pencil': '✏️',
  'edit': '✏️',
  'password': '🔑',
  'knotify': '🎵',
  'bell': '🔔',
  'list': '📝',
  'xmag': '🔍',
  
  // Status Indicators
  'closed': '🔒',
  'encrypted': '🔐',
  'decrypted': '🔓',
  
  // Flags
  'flag': '🚩',
  'flag-black': '🏴',
  'flag-blue': '🔵',
  'flag-green': '🟢',
  'flag-orange': '🟠',
  'flag-pink': '🌸',
  'flag-yellow': '🟡',
  
  // Emotions
  'ksmiletris': '😊',
  'smiley-oh': '😮',
  'smiley-neutral': '😐',
  'smiley-angry': '😠',
  'smily_bad': '☹️',
  
  // People
  'family': '👨‍👩‍👧‍👦',
  'group': '👥',
  'male1': '👨',
  'male2': '🧔',
  'female1': '👩',
  'female2': '👧',
  
  // Numbers (0-9)
  'full-0': '0️⃣',
  'full-1': '1️⃣',
  'full-2': '2️⃣',
  'full-3': '3️⃣',
  'full-4': '4️⃣',
  'full-5': '5️⃣',
  'full-6': '6️⃣',
  'full-7': '7️⃣',
  'full-8': '8️⃣',
  'full-9': '9️⃣',
  
  // Misc
  'clanbomber': '💣',
  'desktop_new': '📌',
  'freemind_butterfly': '🦋',
  'penguin': '🐧',
  'broken-line': '💔',
  'redo': '↩️',
  'licq': '💬',
  'fema': '⚡',
};

/**
 * Get emoji representation of a FreeMind icon
 * @param iconName - FreeMind builtin icon name
 * @returns Emoji string or fallback icon
 */
export function getIconEmoji(iconName: string): string {
  return ICON_MAP[iconName] || '📌'; // Default fallback icon
}

/**
 * Check if an icon name is valid
 */
export function isValidIcon(iconName: string): boolean {
  return iconName in ICON_MAP;
}

/**
 * Get all available icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP);
}

/**
 * Get icon categories for UI organization
 */
export const ICON_CATEGORIES = {
  'Status & Actions': ['help', 'yes', 'button_ok', 'button_cancel', 'info', 'messagebox_warning', 'stop', 'go'],
  'Ideas & Tasks': ['idea', 'wizard', 'prepare', 'launch'],
  'Communication': ['Mail', 'kmail', 'korn', 'kaddressbook', 'bookmark', 'attach'],
  'Time': ['calendar', 'clock', 'hourglass'],
  'Navigation': ['gohome', 'folder', 'back', 'forward', 'up', 'down'],
  'Tools': ['pencil', 'edit', 'password', 'knotify', 'bell', 'list', 'xmag'],
  'Security': ['closed', 'encrypted', 'decrypted'],
  'Flags': ['flag', 'flag-black', 'flag-blue', 'flag-green', 'flag-orange', 'flag-pink', 'flag-yellow'],
  'Emotions': ['ksmiletris', 'smiley-oh', 'smiley-neutral', 'smiley-angry', 'smily_bad'],
  'People': ['family', 'group', 'male1', 'male2', 'female1', 'female2'],
  'Numbers': ['full-0', 'full-1', 'full-2', 'full-3', 'full-4', 'full-5', 'full-6', 'full-7', 'full-8', 'full-9'],
};
