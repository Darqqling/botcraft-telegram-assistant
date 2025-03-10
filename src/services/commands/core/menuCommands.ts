
import { InlineKeyboardMarkup } from '../../telegramService';
import { sendMessage } from './messageUtils';

// Helper function to check if chat is a group chat
const isGroupChat = (chatId: number): boolean => {
  // In Telegram, group chat IDs are typically negative
  return chatId < 0;
};

// Handle start command by showing main menu buttons
export const handleStartCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling start command for user ${userId} in chat ${chatId}`);
  
  // Different welcome message based on chat type
  if (isGroupChat(chatId)) {
    // Group chat welcome message
    const welcomeMessage = `
👋 Привет! Я бот для организации совместных сборов денег!

В групповом чате вы можете:
• 🔹 Создать новый сбор средств
• 🔹 Участвовать в существующих сборах
• 🔹 Получить справку о командах

Выберите действие из меню ниже:
    `;

    const groupMainMenu: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "🔹 Создать новый сбор", callback_data: "group_new_collection" }
        ],
        [
          { text: "🔹 Как это работает?", callback_data: "how_it_works" }
        ],
        [
          { text: "🔹 Помощь", callback_data: "help" }
        ]
      ]
    };

    return sendMessage(token, chatId, welcomeMessage, { replyMarkup: groupMainMenu });
  } else {
    // Personal chat welcome message
    const welcomeMessage = `
👋 Добро пожаловать в Подарочный Бот!

В личном чате с ботом можно:
• 📜 Посмотреть свои сборы
• ℹ️ Как это работает?
• ❓ Помощь

🚫 Создание сборов доступно только в групповых чатах.

Выберите действие из меню ниже:
    `;

    const personalMainMenu: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "📜 Посмотреть мои сборы", callback_data: "my_collections" }
        ],
        [
          { text: "ℹ️ Как это работает?", callback_data: "how_it_works" }
        ],
        [
          { text: "❓ Помощь", callback_data: "help" }
        ]
      ]
    };

    return sendMessage(token, chatId, welcomeMessage, { replyMarkup: personalMainMenu });
  }
};

// Handle help command
export const handleHelpCommand = async (
  token: string,
  chatId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling help command in chat ${chatId}`);
  
  // Different help message based on chat type
  let helpMessage = '';
  
  if (isGroupChat(chatId)) {
    helpMessage = `
📚 Помощь по использованию бота в групповом чате:

Основные команды:
/start - Показать главное меню
/help - Показать это сообщение
/new_collection - Создать новый сбор в группе

В групповом чате вы можете создавать сборы и приглашать всех участников группы присоединиться к нему.
Для просмотра существующих сборов, напишите боту в личные сообщения.
    `;
  } else {
    helpMessage = `
📚 Помощь по использованию бота в личном чате:

Основные команды:
/start - Показать главное меню
/help - Показать это сообщение
/my_collections - Показать ваши сборы

В личном чате вы можете управлять своими сборами и вносить средства.
Для создания новых сборов, добавьте бота в групповой чат и используйте команду /new_collection.
    `;
  }

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  return sendMessage(token, chatId, helpMessage, { replyMarkup: backButton });
};

// Handle how_it_works command
export const handleHowItWorksCommand = async (
  token: string,
  chatId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling how_it_works command in chat ${chatId}`);
  
  const howItWorksMessage = `
🔍 Как работает Подарочный Бот:

1️⃣ Создайте новый сбор в групповом чате, указав название, описание и целевую сумму
2️⃣ Участники группового чата могут присоединиться к сбору нажатием на кнопку
3️⃣ Участники вносят свои взносы через бота
4️⃣ Когда целевая сумма собрана, организатор может завершить сбор
5️⃣ Все участники получают уведомление о завершении сбора

В личном чате вы можете управлять сборами, в которых участвуете, и вносить средства.
В групповом чате вы можете создавать новые сборы.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  return sendMessage(token, chatId, howItWorksMessage, { replyMarkup: backButton });
};

// Handle my_collections command
export const handleMyCollectionsCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling my_collections command for user ${userId} in chat ${chatId}`);
  
  // Check if we're in a group chat
  if (isGroupChat(chatId)) {
    return sendMessage(token, chatId, `Для просмотра ваших сборов, пожалуйста, напишите боту в личные сообщения.`);
  }
  
  // This will be implemented to fetch and display the user's collections
  const collectionsMessage = `
📋 Ваши активные сборы:

У вас пока нет активных сборов. 
В групповом чате вы можете создать новый сбор, используя команду /new_collection.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  return sendMessage(token, chatId, collectionsMessage, { replyMarkup: backButton });
};

// Handle back to main menu command
export const handleBackToMainCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling back_to_main command for user ${userId} in chat ${chatId}`);
  return handleStartCommand(token, chatId, userId);
};

// Export the isGroupChat helper to use it in other files
export { isGroupChat };
