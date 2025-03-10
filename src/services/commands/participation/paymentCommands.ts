
import { ensureUserExists } from '../../collectionService';
import { getCollectionById, getUserById, saveCollection } from '../../storageService';
import { sendMessage } from '../baseCommandHandler';
import { InlineKeyboardMarkup } from '@/services/telegramService';
import { addPayment, notifyPaymentSuccess } from '../../collectionService';

// Обработка команды внесения оплаты
export const handlePay = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /pay collection_id amount
    const parts = text.replace('/pay', '').trim().split(' ');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/pay ID_сбора сумма';
    }
    
    const collectionId = parts[0].trim();
    const amount = parseFloat(parts[1].trim());
    
    // Проверка валидности данных
    if (!collectionId) {
      return 'Ошибка: ID сбора обязателен.';
    }
    
    if (isNaN(amount) || amount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не активен.`;
    }
    
    // Проверяем, есть ли пользователь среди участников
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Предлагаем выбор способа оплаты
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "💵 Я оплатил(а)", callback_data: `i_paid:${collectionId}:${amount}` }
        ],
        [
          { text: "💳 Оплатить через бота", callback_data: `payment_options:${collectionId}:${amount}` }
        ],
        [
          { text: "⬅️ Назад", callback_data: `status:${collectionId}` }
        ]
      ]
    };
    
    await sendMessage(token, chatId, `Выберите способ оплаты взноса в размере ${amount} руб. для сбора "${collection.title}":`, 
      { replyMarkup: inlineKeyboard });
    
    return '';
  } catch (error) {
    console.error('Ошибка при обработке платежа:', error);
    return 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а для внесения оплаты
export const handlePayCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: pay:collection_id
    if (parts.length < 2) {
      return 'Ошибка: неверный формат данных для оплаты.';
    }
    
    const collectionId = parts[1];
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не активен.`;
    }
    
    // Проверяем, есть ли пользователь среди участников
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      // Предлагаем присоединиться
      const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: "Присоединиться к сбору", callback_data: `join:${collectionId}` }
          ]
        ]
      };
      
      await sendMessage(token, chatId, `Вы не являетесь участником сбора "${collection.title}". Сначала присоединитесь:`, 
        { replyMarkup: inlineKeyboard });
      
      return '';
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Создаем клавиатуру с кнопками для разных сумм
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "500 руб.", callback_data: `pay_amount:${collectionId}:500` },
          { text: "1000 руб.", callback_data: `pay_amount:${collectionId}:1000` }
        ],
        [
          { text: "2000 руб.", callback_data: `pay_amount:${collectionId}:2000` },
          { text: "5000 руб.", callback_data: `pay_amount:${collectionId}:5000` }
        ],
        [
          { text: "💳 Оплатить", callback_data: `payment_options:${collectionId}` }
        ],
        [
          { text: "⬅️ Назад", callback_data: `status:${collectionId}` }
        ]
      ]
    };
    
    await sendMessage(token, chatId, `Выберите сумму для внесения в сбор "${collection.title}":`, 
      { replyMarkup: inlineKeyboard });
    
    return '';
  } catch (error) {
    console.error('Ошибка при обработке оплаты:', error);
    return 'Произошла ошибка при обработке оплаты. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка запроса на подтверждение оплаты
export const handleConfirmPayment = async (
  token: string,
  organizerId: number,
  userId: number,
  collectionId: string,
  amount: number
): Promise<boolean> => {
  try {
    // Получаем информацию о коллекции
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return false;
    }
    
    // Проверяем, является ли запрашивающий организатором
    if (collection.organizerId !== organizerId) {
      return false;
    }
    
    // Добавляем платеж
    await addPayment(token, collectionId, userId, amount);
    
    // Отправляем уведомление участнику
    await notifyPaymentSuccess(token, collectionId, userId);
    
    // Отправляем подтверждение организатору
    const organizer = getUserById(organizerId);
    if (organizer) {
      const user = getUserById(userId);
      const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Участник ${userId}`;
      
      await sendMessage(token, organizer.chatId, `Вы подтвердили платеж от ${userName} на сумму ${amount} руб. для сбора "${collection.title}".`);
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при подтверждении платежа:', error);
    return false;
  }
};
