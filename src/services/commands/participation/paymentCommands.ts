
import { addPayment, notifyPaymentSuccess, ensureUserExists } from '../../collectionService';
import { getCollectionById, getUserById, saveCollection } from '../../storageService';
import { sendMessage } from '../baseCommandHandler';
import { InlineKeyboardMarkup } from '@/services/telegramService';

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
    
    // Для тестирования - имитируем сценарий с прямой передачей денег организатору
    if (amount <= 1000) {
      // Электронный платеж для небольших сумм - автоматическое подтверждение
      const success = await addPayment(token, collectionId, userId, amount);
      
      if (!success) {
        return 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.';
      }
      
      // Отправляем уведомление об успешной оплате
      await notifyPaymentSuccess(token, collectionId, userId);
      
      return `Платеж на сумму ${amount} руб. успешно зарегистрирован.\nСпасибо за участие в сборе "${collection.title}"!`;
    } else {
      // Ручная передача денег организатору для крупных сумм
      // Обновляем информацию об участнике - отмечаем предполагаемый взнос
      const participantIndex = collection.participants.findIndex(p => p.userId === userId);
      
      if (participantIndex !== -1) {
        collection.participants[participantIndex].contribution = amount;
        saveCollection(collection);
      }
      
      // Отправляем запрос организатору на подтверждение платежа
      const organizerId = collection.organizerId;
      const organizer = getUserById(organizerId);
      
      if (organizer) {
        try {
          // Создаем клавиатуру с кнопкой подтверждения
          const inlineKeyboard: InlineKeyboardMarkup = {
            inline_keyboard: [
              [
                { text: "Подтвердить платеж", callback_data: `confirm_pay:${collectionId}:${userId}` }
              ]
            ]
          };
          
          const message = `
Пользователь ${firstName} ${lastName || ''} (ID: ${userId}) сообщает, что передал вам ${amount} руб. для сбора "${collection.title}".

Для подтверждения платежа нажмите кнопку ниже:
          `;
          await sendMessage(token, organizer.chatId, message, { replyMarkup: inlineKeyboard });
        } catch (error) {
          console.error(`Ошибка при отправке уведомления организатору:`, error);
        }
      }
      
      return `Сообщение о передаче ${amount} руб. отправлено организатору сбора "${collection.title}".\nПосле подтверждения организатором ваш взнос будет учтен.`;
    }
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
          { text: "Другая сумма", callback_data: `pay_custom:${collectionId}` }
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
