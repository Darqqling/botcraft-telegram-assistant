import { v4 as uuidv4 } from 'uuid';
import { createCollection, updateCollectionStatus, addPayment, notifyPaymentSuccess, ensureUserExists, addGiftOption, voteForGiftOption, updateCollectionDeadline, updateCollectionTargetAmount } from './collectionService';
import { getCollectionById, getUserById } from './storageService';

// Обработка команды создания новой коллекции
export const handleNewCollection = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /new_collection Title|Description|TargetAmount|RecipientId|Participant1,Participant2,...
    const parts = text.replace('/new_collection', '').trim().split('|');
    
    if (parts.length < 4) {
      return 'Ошибка: неверный формат команды. Используйте:\n/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...';
    }
    
    const title = parts[0].trim();
    const description = parts[1].trim();
    const targetAmount = parseFloat(parts[2].trim());
    const recipientId = parts[3].trim() ? parseInt(parts[3].trim()) : undefined;
    const participantIds = parts[4]?.trim().split(',').map(id => parseInt(id.trim())) || [];
    
    // Проверка валидности данных
    if (!title) {
      return 'Ошибка: название сбора обязательно.';
    }
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    // Создаем пользователя-организатора, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Создаем коллекцию
    const collection = await createCollection(
      token,
      userId,
      title,
      description,
      targetAmount,
      participantIds,
      recipientId
    );
    
    // Активируем коллекцию сразу
    await updateCollectionStatus(token, collection.id, 'active');
    
    return `Сбор "${title}" успешно создан и активирован!\nID сбора: ${collection.id}`;
  } catch (error) {
    console.error('Ошибка при создании коллекции:', error);
    return 'Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз.';
  }
};

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
    
    // Добавляем платеж
    const success = await addPayment(token, collectionId, userId, amount);
    
    if (!success) {
      return 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.';
    }
    
    // Отправляем уведомление об успешной оплате
    await notifyPaymentSuccess(token, collectionId, userId);
    
    return `Платеж на сумму ${amount} руб. успешно зарегистрирован.\nСпасибо за участие в сборе "${collection.title}"!`;
  } catch (error) {
    console.error('Ошибка при обработке платежа:', error);
    return 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.';
  }
};

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

// Обработка команды просмотра статуса сбора
export const handleStatus = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /status collection_id
    const collectionId = text.replace('/status', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником или организатором
    const isParticipant = collection.participants.some(p => p.userId === userId);
    const isOrganizer = collection.organizerId === userId;
    
    if (!isParticipant && !isOrganizer) {
      return `Ошибка: у вас нет доступа к сбору "${collection.title}".`;
    }
    
    // Формируем детали о сборе
    const statusText = {
      'pending': 'Ожидает',
      'active': 'Активен',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    }[collection.status];
    
    let message = `
Информация о сборе "${collection.title}"

Статус: ${statusText}
Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб. (${Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
`;

    // Для организатора показываем больше информации
    if (isOrganizer) {
      message += '\nУчастники:\n';
      
      collection.participants.forEach((participant, index) => {
        const user = getUserById(participant.userId);
        const name = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Участник ${participant.userId}`;
        
        message += `${index + 1}. ${name} - ${participant.contribution} руб. (${participant.hasPaid ? 'оплачено' : 'не оплачено'})\n`;
      });
    }
    
    return message;
  } catch (error) {
    console.error('Ошибка при запросе статуса сбора:', error);
    return 'Произошла ошибка при запросе статуса сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды создания сбора в групповом чате
export const handleGroupNewCollection = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /group_new_collection Title|Description|TargetAmount|RecipientId|Deadline(days)
    const parts = text.replace('/group_new_collection', '').trim().split('|');
    
    if (parts.length < 3) {
      return 'Ошибка: неверный формат команды. Используйте:\n/group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)';
    }
    
    const title = parts[0].trim();
    const description = parts[1].trim();
    const targetAmount = parseFloat(parts[2].trim());
    const recipientId = parts[3].trim() ? parseInt(parts[3].trim()) : undefined;
    const deadlineDays = parts[4]?.trim() ? parseInt(parts[4].trim()) : 7; // По умолчанию 7 дней
    
    // Проверка валидности данных
    if (!title) {
      return 'Ошибка: название сбора обязательно.';
    }
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    // Создаем пользователя-организатора, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Рассчитываем срок (дни в миллисекундах)
    const deadline = Date.now() + (deadlineDays * 24 * 60 * 60 * 1000);
    
    // Создаем коллекцию с привязкой к групповому чату
    const collection = await createCollection(
      token,
      userId,
      title,
      description,
      targetAmount,
      [], // Участники будут добавляться через /join_collection
      recipientId,
      chatId // groupChatId
    );
    
    // Устанавливаем срок
    updateCollectionDeadline(collection.id, deadline);
    
    // Активируем коллекцию сразу
    await updateCollectionStatus(token, collection.id, 'active');
    
    return `Сбор "${title}" успешно создан в этом чате!\n\nЦель: ${targetAmount} руб.\nСрок: ${new Date(deadline).toLocaleDateString()}\n\nДля участия отправьте команду:\n/join_collection ${collection.id}`;
  } catch (error) {
    console.error('Ошибка при создании коллекции в групповом чате:', error);
    return 'Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды присоединения к сбору
export const handleJoinCollection = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /join_collection collection_id
    const collectionId = text.replace('/join_collection', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не активен или уже завершен.`;
    }
    
    // Проверяем, не является ли пользователь уже участником
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (isParticipant) {
      return `Вы уже являетесь участником сбора "${collection.title}".`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Добавляем пользователя как участника
    collection.participants.push({
      userId,
      collectionId,
      contribution: 0,
      hasPaid: false
    });
    
    // Обновляем информацию о коллекции
    collection.updatedAt = Date.now();
    await updateCollectionStatus(token, collectionId, collection.status);
    
    return `Вы успешно присоединились к сбору "${collection.title}"!\n\nДля внесения средств используйте команду:\n/pay ${collectionId} [сумма]`;
  } catch (error) {
    console.error('Ошибка при присоединении к сбору:', error);
    return 'Произошла ошибка при присоединении к сбору. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды добавления варианта подарка
export const handleAddGiftOption = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /add_gift_option collection_id|Title|Description
    const parts = text.replace('/add_gift_option', '').trim().split('|');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/add_gift_option ID_сбора|Название|Описание';
    }
    
    const collectionId = parts[0].trim();
    const title = parts[1].trim();
    const description = parts.length > 2 ? parts[2].trim() : '';
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником или организатором
    const isParticipant = collection.participants.some(p => p.userId === userId);
    const isOrganizer = collection.organizerId === userId;
    
    if (!isParticipant && !isOrganizer) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Добавляем вариант подарка
    const giftOption = addGiftOption(collectionId, title, description);
    
    // Отправляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const message = `
Добавлен новый вариант подарка для сбора "${collection.title}":

"${title}"
${description ? `${description}\n` : ''}
Для голосования используйте команду:
/vote ${collectionId} ${giftOption.id}
      `;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Вариант подарка "${title}" успешно добавлен к сбору "${collection.title}".`;
  } catch (error) {
    console.error('Ошибка при добавлении варианта подарка:', error);
    return 'Произошла ошибка при добавлении варианта подарка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды голосования за вариант подарка
export const handleVote = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /vote collection_id option_id
    const parts = text.replace('/vote', '').trim().split(' ');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/vote ID_сбора ID_варианта';
    }
    
    const collectionId = parts[0].trim();
    const optionId = parts[1].trim();
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Проверяем, существует ли такой вариант
    if (!collection.giftOptions || !collection.giftOptions.find(opt => opt.id === optionId)) {
      return 'Ошибка: указанный вариант подарка не найден.';
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Голосуем за вариант
    voteForGiftOption(collectionId, userId, optionId);
    
    // Находим вариант для вывода его названия
    const option = collection.giftOptions.find(opt => opt.id === optionId);
    
    // Отп��авляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const message = `${firstName} ${lastName || ''} проголосовал(а) за вариант "${option?.title}".`;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Ваш голос за вариант "${option?.title}" в сборе "${collection.title}" учтен.`;
  } catch (error) {
    console.error('Ошибка при голосовании:', error);
    return 'Произошла ошибка при голосовании. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды проверки статуса сбора (расширенная версия)
export const handleCollectionStatus = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /collection_status collection_id
    const collectionId = text.replace('/collection_status', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником или организатором
    const isParticipant = collection.participants.some(p => p.userId === userId);
    const isOrganizer = collection.organizerId === userId;
    
    if (!isParticipant && !isOrganizer) {
      return `Ошибка: у вас нет доступа к сбору "${collection.title}".`;
    }
    
    // Формируем детали о сборе
    const statusText = {
      'pending': 'Ожидает',
      'active': 'Активен',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    }[collection.status];
    
    let message = `
Информация о сборе "${collection.title}"

Статус: ${statusText}
Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб. (${Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
`;

    if (collection.deadline) {
      const daysLeft = Math.ceil((collection.deadline - Date.now()) / (24 * 60 * 60 * 1000));
      message += `Осталось дней: ${daysLeft > 0 ? daysLeft : 'Срок истек'}\n`;
    }
    
    // Информация о вариантах подарка
    if (collection.giftOptions && collection.giftOptions.length > 0) {
      message += '\nВарианты подарка:\n';
      
      // Сортируем по количеству голосов (от большего к меньшему)
      const sortedOptions = [...collection.giftOptions].sort((a, b) => b.votes - a.votes);
      
      sortedOptions.forEach((option, index) => {
        message += `${index + 1}. "${option.title}" - ${option.votes} голосов\n`;
      });
    }
    
    // Для организатора показываем больше информации
    if (isOrganizer) {
      message += '\nУчастники:\n';
      
      collection.participants.forEach((participant, index) => {
        const user = getUserById(participant.userId);
        const name = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Участник ${participant.userId}`;
        
        message += `${index + 1}. ${name} - ${participant.contribution} руб. (${participant.hasPaid ? 'оплачено' : 'не оплачено'})`;
        
        if (participant.vote) {
          const votedOption = collection.giftOptions?.find(opt => opt.id === participant.vote);
          if (votedOption) {
            message += ` - голос за "${votedOption.title}"`;
          }
        }
        
        message += '\n';
      });
    }
    
    return message;
  } catch (error) {
    console.error('Ошибка при запросе статуса сбора:', error);
    return 'Произошла ошибка при запросе статуса сбора. Пожалуйста, попробуйте еще раз.';
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

// Добавляем новую функцию для отправки сообщений в группу
const sendGroupMessage = async (token: string, chatId: number, text: string) => {
  const { sendMessage } = await import('./telegramService');
  return sendMessage(token, chatId, text);
};

// Добавляем новую функцию для отправки напоминаний
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

// Импортируем функцию sendMessage
const { sendMessage } = require('./telegramService');

// Обработка любой команды (обновляем для поддержки новых команд)
export const processCommand = async (
  token: string,
  message: any
): Promise<string | null> => {
  const text = message?.text;
  
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  const userId = message?.from?.id;
  const chatId = message?.chat?.id;
  const firstName = message?.from?.first_name || 'User';
  const lastName = message?.from?.last_name;
  const username = message?.from?.username;
  
  if (!userId || !chatId) {
    return null;
  }
  
  if (text.startsWith('/new_collection')) {
    return handleNewCollection(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/group_new_collection')) {
    return handleGroupNewCollection(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/join_collection')) {
    return handleJoinCollection(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/pay')) {
    return handlePay(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/confirm_gift')) {
    return handleConfirmGift(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/cancel')) {
    return handleCancel(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/status')) {
    return handleStatus(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/collection_status')) {
    return handleCollectionStatus(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/add_gift_option')) {
    return handleAddGiftOption(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/vote')) {
    return handleVote(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/update_amount')) {
    return handleUpdateAmount(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/send_reminders')) {
    return handleSendReminders(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/help')) {
    return `
Доступные команды:

/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...
- Создает новый сбор средств

/group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)
- Создает новый сбор в групповом чате

/join_collection ID_сбора
- Присоединиться к сбору

/pay ID_сбора сумма
- Регистрирует ваш взнос в сбор

/add_gift_option ID_сбора|Название|Описание
- Добавить вариант подарка для голосования

/vote ID_сбора ID_варианта
- Проголосовать за вариант подарка

/collection_status ID_сбора
- Показывает подробный статус сбора

/confirm_gift ID_сбора
- Подтверждает вручение подарка (только для организатора)

/cancel ID_сбора
- Отменяет сбор (только для организатора)

/update_amount ID_сбора новая_сумма
- Изменяет целевую сумму сбора (только для организатора)

/send_reminders ID_сбора
- Отправляет напоминания участникам (только для организатора)

/status ID_сбора
- Показывает статус сбора
`;
  }
  
  return null;
};
