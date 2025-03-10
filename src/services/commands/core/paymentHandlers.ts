
import { InlineKeyboardMarkup } from '../../telegramService';
import { sendMessage } from './messageUtils';

// Handle payment options command
export const handlePaymentOptionsCommand = async (
  token: string,
  chatId: number,
  collectionId: string
): Promise<any> => {
  const paymentMessage = `
💳 Выберите способ оплаты:

Сейчас оплата через бота временно недоступна. Вы можете перевести деньги организатору напрямую и затем нажать кнопку "Я оплатил".
  `;

  const paymentOptions: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Я оплатил", callback_data: `i_paid:${collectionId}` }
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
  amount: number
): Promise<any> => {
  // This will send confirmation to the user
  const confirmationMessage = `
✅ Спасибо за ваш взнос!

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

  // TODO: Send notification to the organizer with confirmation button
  // This part will be implemented in the payment handling
  
  return { ok: true };
};
