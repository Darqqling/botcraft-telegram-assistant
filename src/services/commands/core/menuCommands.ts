
import { InlineKeyboardMarkup } from '../../telegramService';
import { sendMessage } from './messageUtils';

// Handle start command by showing main menu buttons
export const handleStartCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling start command for user ${userId} in chat ${chatId}`);
  
  const welcomeMessage = `
👋 Добро пожаловать в Подарочный Бот!

Я помогу вам организовать сбор средств на подарок или другое совместное мероприятие.
Выберите действие из меню ниже:
  `;

  const mainMenu: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "🔹 Создать новый сбор", callback_data: "new_collection" }
      ],
      [
        { text: "🔹 Посмотреть мои сборы", callback_data: "my_collections" }
      ],
      [
        { text: "🔹 Как это работает?", callback_data: "how_it_works" }
      ],
      [
        { text: "🔹 Помощь", callback_data: "help" }
      ]
    ]
  };

  return sendMessage(token, chatId, welcomeMessage, { replyMarkup: mainMenu });
};

// Handle help command
export const handleHelpCommand = async (
  token: string,
  chatId: number
): Promise<any> => {
  console.log(`[MenuCommands] Handling help command in chat ${chatId}`);
  
  const helpMessage = `
📚 Помощь по использованию бота:

Основные команды:
/start - Запустить бота и показать главное меню
/help - Показать это сообщение

Для создания нового сбора нажмите кнопку "Создать новый сбор" в главном меню.
Для просмотра ваших активных сборов нажмите "Посмотреть мои сборы".

Если у вас возникли проблемы, напишите /start чтобы вернуться в главное меню.
  `;

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

1️⃣ Создайте новый сбор, указав название, описание и целевую сумму
2️⃣ Пригласите участников, отправив им ссылку или добавив бота в групповой чат
3️⃣ Участники вносят свои взносы через бота
4️⃣ Когда целевая сумма собрана, организатор может завершить сбор
5️⃣ Все участники получают уведомление о завершении сбора

Бот помогает отслеживать статус сбора и упрощает координацию между участниками.
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
  
  // This will be implemented to fetch and display the user's collections
  const collectionsMessage = `
📋 Ваши активные сборы:

У вас пока нет активных сборов. 
Создайте новый сбор, нажав на кнопку "Создать новый сбор" в главном меню.
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
