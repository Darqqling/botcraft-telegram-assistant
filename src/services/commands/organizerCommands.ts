
import { updateCollectionStatus, ensureUserExists, updateCollectionTargetAmount } from '../collectionService';
import { getCollectionById, getUserById, saveCollection } from '../storageService';
import { sendMessage, InlineKeyboardMarkup } from '../telegramService';
import { sendGroupMessage } from './baseCommandHandler';

// Обработка команды подтверждения вручения подарка
export const handleConfirmGift = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /confirm_gift collection_id
    const collectionId = text.replace('/confirm_gift', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может подтвердить вручение подарка.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не находится в активном состоянии.`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Завершаем коллекцию
    await updateCollectionStatus(token, collectionId, 'completed');
    
    return `Сбор "${collection.title}" успешно завершен. Уведомления отправлены всем участникам.`;
  } catch (error) {
    console.error('Ошибка при подтверждении вручения подарка:', error);
    return 'Произошла ошибка при подтверждении вручения подарка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды отмены сбора
export const handleCancel = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /cancel collection_id
    const collectionId = text.replace('/cancel', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может отменить сбор.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не может быть отменен (уже завершен или отменен).`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Отменяем коллекцию
    await updateCollectionStatus(token, collectionId, 'cancelled');
    
    return `Сбор "${collection.title}" отменен. Уведомления о возврате средств отправлены участникам.`;
  } catch (error) {
    console.error('Ошибка при отмене сбора:', error);
    return 'Произошла ошибка при отмене сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды корректировки су��мы сбора
export const handleUpdateAmount = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /update_amount collection_id new_amount
    const parts = text.replace('/update_amount', '').trim().split(' ');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/update_amount ID_сбора новая_сумма';
    }
    
    const collectionId = parts[0].trim();
    const newAmount = parseFloat(parts[1].trim());
    
    if (isNaN(newAmount) || newAmount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Только организатор может изменять сумму
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может изменять сумму.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не может быть изменен (уже завершен или отменен).`;
    }
    
    // Обновляем сумму
    updateCollectionTargetAmount(collectionId, newAmount);
    
    // Уведомляем участников об изменении суммы
    for (const participant of collection.participants) {
      const user = getUserById(participant.userId);
      
      if (user) {
        const message = `
Целевая сумма сбора "${collection.title}" изменена.

Новая цель: ${newAmount} руб.
Уже собрано: ${collection.currentAmount} руб.
        `;
        
        try {
          await sendMessage(token, user.chatId, message);
        } catch (error) {
          console.error(`Ошибка при отправке уведомления пользователю ${user.id}:`, error);
        }
      }
    }
    
    // Отправляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const message = `
Организатор изменил целевую сумму сбора "${collection.title}".

Новая цель: ${newAmount} руб.
Уже собрано: ${collection.currentAmount} руб.
      `;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Целевая сумма сбора "${collection.title}" успешно изменена на ${newAmount} руб.`;
  } catch (error) {
    console.error('Ошибка при изменении суммы сбора:', error);
    return 'Произошла ошибка при изменении суммы сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Функция для отправки напоминаний
export const handleSendReminders = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /send_reminders collection_id
    const collectionId = text.replace('/send_reminders', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Только организатор может отправлять напоминания
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может отправлять напоминания.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не активен.`;
    }
    
    // Отправляем напоминания участникам, которые еще не внесли деньги
    let remindersSent = 0;
    
    for (const participant of collection.participants) {
      if (!participant.hasPaid) {
        const user = getUserById(participant.userId);
        
        if (user && (!participant.lastReminder || Date.now() - participant.lastReminder > 24 * 60 * 60 * 1000)) {
          // Создаем клавиатуру с кнопками
          const inlineKeyboard: InlineKeyboardMarkup = {
            inline_keyboard: [
              [
                { text: "Внести оплату", callback_data: `pay:${collection.id}` }
              ],
              [
                { text: "Напомнить позже", callback_data: `remind_later:${collection.id}:24` }
              ]
            ]
          };
          
          const message = `
Напоминание о сборе "${collection.title}"

Целевая сумма: ${collection.targetAmount} руб.
Уже собрано: ${collection.currentAmount} руб.

Пожалуйста, не забудьте внести свой взнос:
          `;
          
          try {
            await sendMessage(token, user.chatId, message, { replyMarkup: inlineKeyboard });
            
            // Обновляем время последнего напоминания
            participant.lastReminder = Date.now();
            saveCollection(collection);
            
            remindersSent++;
          } catch (error) {
            console.error(`Ошибка при отправке напоминания пользователю ${user.id}:`, error);
          }
        }
      }
    }
    
    return `Напоминания отправлены ${remindersSent} участникам сбора "${collection.title}".`;
  } catch (error) {
    console.error('Ошибка при отправке напоминаний:', error);
    return 'Произошла ошибка при отправке напоминаний. Пожалуйста, попробуйте еще раз.';
  }
};

// Новая функция для подтверждения платежа организатором
export const handleConfirmPayment = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /confirm_payment collection_id user_id
    const parts = text.replace('/confirm_payment', '').trim().split(' ');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/confirm_payment ID_сбора ID_пользователя';
    }
    
    const collectionId = parts[0].trim();
    const payingUserId = parseInt(parts[1].trim());
    
    if (isNaN(payingUserId)) {
      return 'Ошибка: ID пользователя должен быть числом.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Только организатор может подтверждать платежи
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может подтверждать платежи.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не активен.`;
    }
    
    // Проверяем, что пользователь является участником сбора
    const participantIndex = collection.participants.findIndex(p => p.userId === payingUserId);
    
    if (participantIndex === -1) {
      return `Ошибка: пользователь с ID ${payingUserId} не является участником сбора.`;
    }
    
    // Обновляем статус оплаты участника
    collection.participants[participantIndex].hasPaid = true;
    
    // Обновляем информацию о коллекции
    saveCollection(collection);
    
    // Отправляем уведомление пользователю, чей платеж подтвержден
    const payingUser = getUserById(payingUserId);
    if (payingUser) {
      try {
        const message = `
Ваш платеж для сбора "${collection.title}" был подтвержден организатором!

Спасибо за участие в сборе!
        `;
        await sendMessage(token, payingUser.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления пользователю ${payingUserId}:`, error);
      }
    }
    
    // Отправляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const payingUser = getUserById(payingUserId);
      const payingUserName = payingUser 
        ? `${payingUser.firstName} ${payingUser.lastName || ''}`.trim() 
        : `Участник ${payingUserId}`;
      
      const message = `
Организатор подтвердил платеж от ${payingUserName} для сбора "${collection.title}".

Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб.
      `;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Платеж пользователя с ID ${payingUserId} успешно подтвержден.`;
  } catch (error) {
    console.error('Ошибка при подтверждении платежа:', error);
    return 'Произошла ошибка при подтверждении платежа. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а функции "Напомнить позже"
export const handleRemindLaterCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: remind_later:collection_id:hours
    if (parts.length < 3) {
      return 'Ошибка: неверный формат данных для отложенного напоминания.';
    }
    
    const collectionId = parts[1];
    const hours = parseInt(parts[2]);
    
    if (isNaN(hours)) {
      return 'Ошибка: часы должны быть числом.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником
    const participantIndex = collection.participants.findIndex(p => p.userId === userId);
    
    if (participantIndex === -1) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Устанавливаем время последнего напоминания
    collection.participants[participantIndex].lastReminder = Date.now();
    saveCollection(collection);
    
    const nextReminderTime = new Date(Date.now() + hours * 60 * 60 * 1000);
    
    return `Напоминание отложено. Следующее напоминание будет отправлено не ранее ${nextReminderTime.toLocaleDateString()} ${nextReminderTime.toLocaleTimeString()}.`;
  } catch (error) {
    console.error('Ошибка при обработке запроса на отложенное напоминание:', error);
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а подтверждения вручения подарка
export const handleConfirmGiftCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: confirm_gift:collection_id
    if (parts.length < 2) {
      return 'Ошибка: неверный формат данных для подтверждения подарка.';
    }
    
    const collectionId = parts[1];
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может подтвердить вручение подарка.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не находится в активном состоянии.`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Завершаем коллекцию
    await updateCollectionStatus(token, collectionId, 'completed');
    
    return `Сбор "${collection.title}" успешно завершен. Уведомления отправлены всем участникам.`;
  } catch (error) {
    console.error('Ошибка при подтверждении вручения подарка:', error);
    return 'Произошла ошибка при подтверждении вручения подарка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а отмены сбора
export const handleCancelCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: cancel:collection_id
    if (parts.length < 2) {
      return 'Ошибка: неверный формат данных для отмены сбора.';
    }
    
    const collectionId = parts[1];
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может отменить сбор.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не может быть отменен (уже завершен или отменен).`;
    }
    
    // Подтверждение отмены
    const confirmKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Да, отменить сбор", callback_data: `cancel_confirm:${collectionId}` }
        ],
        [
          { text: "Нет, оставить активным", callback_data: `status:${collectionId}` }
        ]
      ]
    };
    
    await sendMessage(token, chatId, `Вы уверены, что хотите отменить сбор "${collection.title}"?`, 
      { replyMarkup: confirmKeyboard });
    
    return '';
  } catch (error) {
    console.error('Ошибка при обработке запроса на отмену сбора:', error);
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а подтверждения платежа
export const handleConfirmPaymentCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: confirm_pay:collection_id:user_id
    if (parts.length < 3) {
      return 'Ошибка: неверный формат данных для подтверждения платежа.';
    }
    
    const collectionId = parts[1];
    const payingUserId = parseInt(parts[2]);
    
    if (isNaN(payingUserId)) {
      return 'Ошибка: ID пользователя должен быть числом.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Только организатор может подтверждать платежи
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может подтверждать платежи.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не активен.`;
    }
    
    // Проверяем, что пользователь является участником сбора
    const participantIndex = collection.participants.findIndex(p => p.userId === payingUserId);
    
    if (participantIndex === -1) {
      return `Ошибка: пользователь с ID ${payingUserId} не является участником сбора.`;
    }
    
    // Обновляем статус оплаты участника
    collection.participants[participantIndex].hasPaid = true;
    collection.currentAmount += collection.participants[participantIndex].contribution;
    
    // Обновляем информацию о коллекции
    saveCollection(collection);
    
    // Отправляем уведомление пользователю, чей платеж подтвержден
    const payingUser = getUserById(payingUserId);
    if (payingUser) {
      try {
        const message = `
Ваш платеж для сбора "${collection.title}" был подтвержден организатором!

Спасибо за участие в сборе!
        `;
        await sendMessage(token, payingUser.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления пользователю ${payingUserId}:`, error);
      }
    }
    
    // Отправляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const payingUser = getUserById(payingUserId);
      const payingUserName = payingUser 
        ? `${payingUser.firstName} ${payingUser.lastName || ''}`.trim() 
        : `Участник ${payingUserId}`;
      
      const message = `
Организатор подтвердил платеж от ${payingUserName} для сбора "${collection.title}".

Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб.
      `;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Платеж пользователя с ID ${payingUserId} успешно подтвержден.`;
  } catch (error) {
    console.error('Ошибка при подтверждении платежа:', error);
    return 'Произошла ошибка при подтверждении платежа. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а изменения суммы сбора
export const handleUpdateAmountCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: update_amount:collection_id
    if (parts.length < 2) {
      return 'Ошибка: неверный формат данных для изменения суммы.';
    }
    
    const collectionId = parts[1];
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Только организатор может изменять сумму
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может изменять сумму.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не может быть изменен (уже завершен или отменен).`;
    }
    
    // Отправляем инструкции по изменению суммы
    await sendMessage(token, chatId, `Для изменения суммы сбора "${collection.title}", отправьте команду:\n\n/update_amount ${collectionId} новая_сумма`);
    
    return '';
  } catch (error) {
    console.error('Ошибка при обработке запроса на изменение суммы:', error);
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }
};
