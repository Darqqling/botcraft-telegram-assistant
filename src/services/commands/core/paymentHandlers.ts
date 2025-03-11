
import { InlineKeyboardMarkup } from '../../telegramService';
import { sendMessage } from './messageUtils';
import { getCollectionById, saveCollection, getUserById } from '../../storageService';
import { updateCollectionStatus } from '../../collectionService';
import { v4 as uuidv4 } from 'uuid';

// Handle payment options command
export const handlePaymentOptionsCommand = async (
  token: string,
  chatId: number,
  collectionId: string
): Promise<any> => {
  console.log(`[PaymentHandlers] Displaying payment options for collection ${collectionId} to chat ${chatId}`);
  
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(token, chatId, "Ошибка: сбор не найден. Возможно, он был отменен или удален.");
  }

  const paymentMessage = `
💳 Выберите способ оплаты для сбора "${collection.title}":

Сейчас оплата через бота временно недоступна. Вы можете перевести деньги организатору напрямую и затем нажать кнопку "Я оплатил".

Организатор: ${getUserById(collection.organizerId)?.firstName || "Организатор"}
Целевая сумма: ${collection.targetAmount} руб.
Собрано: ${collection.currentAmount} руб.
  `;

  const paymentOptions: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Я оплатил организатору", callback_data: `i_paid:${collectionId}` }
      ],
      [
        { text: "500 руб.", callback_data: `i_paid:${collectionId}:500` },
        { text: "1000 руб.", callback_data: `i_paid:${collectionId}:1000` }
      ],
      [
        { text: "⬅️ Назад", callback_data: `pay:${collectionId}` }
      ]
    ]
  };

  return sendMessage(token, chatId, paymentMessage, { replyMarkup: paymentOptions });
};

// Handle "I paid" confirmation
export const handleIPaidCommand = async (
  token: string,
  chatId: number,
  userId: number,
  firstName: string,
  collectionId: string,
  amount: number = 1000
): Promise<any> => {
  console.log(`[PaymentHandlers] Processing payment confirmation for user ${userId} in collection ${collectionId} for ${amount} rubles`);
  
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(token, chatId, "Ошибка: сбор не найден. Возможно, он был отменен или удален.");
  }
  
  // Check if user is a participant
  const participantIndex = collection.participants.findIndex(p => p.userId === userId);
  
  if (participantIndex === -1) {
    const joinKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Присоединиться к сбору", callback_data: `join:${collectionId}` }
        ],
        [
          { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
        ]
      ]
    };
    
    return sendMessage(token, chatId, `Вы не являетесь участником этого сбора. Чтобы внести деньги, сначала присоединитесь:`, 
      { replyMarkup: joinKeyboard });
  }

  // This will send confirmation to the user
  const confirmationMessage = `
✅ Спасибо за ваш взнос!

Информация о вашем платеже:
- Сумма: ${amount} руб.
- Сбор: "${collection.title}"

Ваше сообщение о передаче ${amount} руб. отправлено организатору для подтверждения.
После подтверждения организатором, ваш взнос будет учтен в сборе.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  await sendMessage(token, chatId, confirmationMessage, { replyMarkup: backButton });
  
  // Send notification to the organizer with confirmation button
  const organizer = getUserById(collection.organizerId);
  
  if (organizer && organizer.chatId) {
    const notificationMessage = `
📢 Новое уведомление о платеже!

Участник: ${firstName}
Сбор: "${collection.title}"
Сумма: ${amount} руб.

Подтвердите, пожалуйста, получение средств:
    `;
    
    const confirmationKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "✅ Подтвердить оплату", callback_data: `confirm_payment:${collectionId}:${userId}:${amount}` }
        ],
        [
          { text: "❌ Отклонить", callback_data: `reject_payment:${collectionId}:${userId}:${amount}` }
        ]
      ]
    };
    
    await sendMessage(token, organizer.chatId, notificationMessage, { replyMarkup: confirmationKeyboard });
    console.log(`[PaymentHandlers] Sent payment confirmation request to organizer ${organizer.id}`);
  } else {
    console.error(`[PaymentHandlers] Could not notify organizer: organizer not found or has no chat ID`);
  }
  
  return { ok: true };
};

// Handle payment confirmation by organizer
export const handleConfirmPaymentCommand = async (
  token: string,
  chatId: number,
  userId: number,
  collectionId: string,
  participantId: number,
  amount: number
): Promise<any> => {
  console.log(`[PaymentHandlers] Processing payment confirmation by organizer ${userId} for participant ${participantId} in collection ${collectionId}`);
  
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(token, chatId, "Ошибка: сбор не найден. Возможно, он был отменен или удален.");
  }
  
  // Verify that the user confirming is the organizer
  if (collection.organizerId !== userId) {
    return sendMessage(token, chatId, "Ошибка: только организатор сбора может подтверждать платежи.");
  }
  
  // Find the participant
  const participantIndex = collection.participants.findIndex(p => p.userId === participantId);
  
  if (participantIndex === -1) {
    return sendMessage(token, chatId, "Ошибка: участник не найден в этом сборе.");
  }
  
  // Update participant payment status
  collection.participants[participantIndex].hasPaid = true;
  collection.participants[participantIndex].contribution += amount;
  
  // Update collection total amount
  collection.currentAmount += amount;
  
  // Save changes to collection
  saveCollection(collection);
  
  // Add transaction record (would be implemented in a production system)
  // addTransaction(collectionId, participantId, amount, 'contribution');
  
  // Record activity in the system log
  const transaction = {
    id: uuidv4(),
    collectionId: collectionId,
    userId: participantId,
    amount: amount,
    type: 'contribution' as const,
    timestamp: Date.now()
  };
  
  // Check if target amount is reached and update status if needed
  if (collection.currentAmount >= collection.targetAmount && collection.status === 'active') {
    collection.status = 'completed';
    saveCollection(collection);
    
    // Update collection status and notify participants
    await updateCollectionStatus(token, collectionId, 'completed');
  }
  
  // Notify organizer
  const confirmationMessage = `
✅ Платеж подтвержден!

Участник: ${getUserById(participantId)?.firstName || `Участник ID:${participantId}`}
Сбор: "${collection.title}"
Сумма: ${amount} руб.

Текущий прогресс сбора: ${collection.currentAmount} / ${collection.targetAmount} руб.
${collection.currentAmount >= collection.targetAmount ? '🎉 Целевая сумма достигнута!' : ''}
  `;
  
  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "📊 Статус сбора", callback_data: `collection_status:${collectionId}` }
      ],
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };
  
  await sendMessage(token, chatId, confirmationMessage, { replyMarkup: backButton });
  
  // Notify participant about confirmed payment
  const participant = getUserById(participantId);
  if (participant && participant.chatId) {
    const participantMessage = `
✅ Ваш платеж подтвержден!

Сбор: "${collection.title}"
Сумма: ${amount} руб.

Спасибо за участие! 🎊
    `;
    
    const participantKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "📊 Статус сбора", callback_data: `status:${collectionId}` }
        ],
        [
          { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
        ]
      ]
    };
    
    await sendMessage(token, participant.chatId, participantMessage, { replyMarkup: participantKeyboard });
  }
  
  return { ok: true };
};

// Handle payment rejection by organizer
export const handleRejectPaymentCommand = async (
  token: string,
  chatId: number,
  userId: number,
  collectionId: string,
  participantId: number,
  amount: number
): Promise<any> => {
  console.log(`[PaymentHandlers] Processing payment rejection by organizer ${userId} for participant ${participantId} in collection ${collectionId}`);
  
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(token, chatId, "Ошибка: сбор не найден. Возможно, он был отменен или удален.");
  }
  
  // Verify that the user rejecting is the organizer
  if (collection.organizerId !== userId) {
    return sendMessage(token, chatId, "Ошибка: только организатор сбора может отклонять платежи.");
  }
  
  // Notify organizer
  const rejectMessage = `
❌ Платеж отклонен!

Участник: ${getUserById(participantId)?.firstName || `Участник ID:${participantId}`}
Сбор: "${collection.title}"
Сумма: ${amount} руб.

Вы отклонили этот платеж. Участник получит уведомление.
  `;
  
  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "📊 Статус сбора", callback_data: `collection_status:${collectionId}` }
      ],
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };
  
  await sendMessage(token, chatId, rejectMessage, { replyMarkup: backButton });
  
  // Notify participant about rejected payment
  const participant = getUserById(participantId);
  if (participant && participant.chatId) {
    const participantMessage = `
❌ Ваш платеж не подтвержден!

Сбор: "${collection.title}"
Сумма: ${amount} руб.

Организатор не подтвердил получение оплаты. Пожалуйста, свяжитесь с организатором для уточнения.
    `;
    
    const participantKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "📊 Статус сбора", callback_data: `status:${collectionId}` }
        ],
        [
          { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
        ]
      ]
    };
    
    await sendMessage(token, participant.chatId, participantMessage, { replyMarkup: participantKeyboard });
  }
  
  return { ok: true };
};
