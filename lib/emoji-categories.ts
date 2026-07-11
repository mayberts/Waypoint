export interface EmojiCategory {
  label: string;
  emoji: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: "General",
    emoji: ["📁", "🗂️", "📌", "⭐", "❤️", "🔖", "✅", "🎯", "🏆", "🎁", "🔒", "🔑", "📋", "📎", "🗃️"],
  },
  {
    label: "Work & Productivity",
    emoji: ["💼", "📊", "📈", "📉", "💡", "🗓️", "📅", "⏰", "📝", "🧾", "📇", "🖇️", "🗒️", "💬", "📤"],
  },
  {
    label: "Tech & Dev",
    emoji: ["💻", "🖥️", "⌨️", "🖱️", "🔧", "🛠️", "🐛", "🔌", "📦", "💾", "🧮", "⚙️", "🔋", "📡"],
  },
  {
    label: "Learning & Reference",
    emoji: ["📚", "🎓", "📖", "✏️", "🔬", "🧪", "🧠", "📐", "🌐", "🗞️", "📰"],
  },
  {
    label: "Media & Entertainment",
    emoji: ["🎬", "🎮", "🎵", "🎨", "📷", "📺", "🎧", "🎭", "🎤", "🎹", "🎲", "🍿", "📸"],
  },
  {
    label: "Travel & Places",
    emoji: ["✈️", "🏠", "🗺️", "🏖️", "🚗", "🚆", "🏨", "🗽", "🏔️", "🌍", "🧳", "⛺"],
  },
  {
    label: "Food & Drink",
    emoji: ["🍔", "☕", "🍕", "🍣", "🍳", "🍰", "🍷", "🍺", "🥗", "🍩"],
  },
  {
    label: "Shopping & Money",
    emoji: ["🛒", "💰", "💳", "🏷️", "🛍️"],
  },
  {
    label: "Nature & Weather",
    emoji: ["🌱", "🔥", "🌤️", "🌊", "🌸", "🐾", "🦋"],
  },
  {
    label: "Sports & Hobbies",
    emoji: ["⚽", "🏀", "🎳", "🏈", "🎣", "🏋️", "🚴", "🧩"],
  },
  {
    label: "Misc & Fun",
    emoji: ["🚀", "🎉", "✨", "💎", "🕹️", "🔮", "🧸"],
  },
];
