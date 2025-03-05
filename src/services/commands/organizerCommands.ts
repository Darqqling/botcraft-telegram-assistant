
import { updateCollectionStatus, ensureUserExists, updateCollectionTargetAmount } from '../collectionService';
import { getCollectionById, getUserById } from '../storageService';
import { sendMessage } from '../telegramService';
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

// Обработка команды корректировки суммы сбора
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
        
        if (user) {
          const message = `
Напоминание о сборе "${collection.title}"

Целевая сумма: ${collection.targetAmount} руб.
Уже собрано: ${collection.currentAmount} руб.

Пожалуйста, не забудьте внести свой взнос используя команду:
/pay ${collection.id} [сумма]
          `;
          
          try {
            await sendMessage(token, user.chatId, message);
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
