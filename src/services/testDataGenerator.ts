import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  Collection, 
  CollectionParticipant, 
  Transaction,
  CollectionStatus,
  GiftOption
} from '../types/collectionTypes';
import { ChatHistory } from '../types/adminTypes';

// Список имен для генерации случайных пользователей
const firstNames = [
  'Александр', 'Екатерина', 'Михаил', 'Анна', 'Дмитрий', 
  'Ольга', 'Иван', 'Мария', 'Сергей', 'Наталья', 
  'Андрей', 'Елена', 'Павел', 'Татьяна', 'Максим'
];

const lastNames = [
  'Иванов', 'Смирнова', 'Кузнецов', 'Попова', 'Соколов', 
  'Лебедева', 'Новиков', 'Морозова', 'Петров', 'Волкова', 
  'Соловьев', 'Васильева', 'Зайцев', 'Павлова', 'Семенов'
];

const usernames = [
  'alex_cool', 'kate_beauty', 'mike_tech', 'anna_smile', 'dima_pro', 
  'olga_star', 'ivan_boss', 'maria_joy', 'sergey_dev', 'natali_art', 
  'andrey_gym', 'elena_travel', 'pavel_music', 'tanya_books', 'max_game'
];

const chatTitles = [
  'Отдел маркетинга', 'Команда разработки', 'Друзья с университета', 
  'Семейный чат', 'Одноклассники', 'Поход в горы 2024', 
  'День рождения Алексея', 'Коллеги по работе', 'Футбольная команда', 'Книжный клуб'
];

const collectionTitles = [
  'День рождения Маши', 'Юбилей директора', 'Свадебный подарок', 
  'Новый год 2025', 'Подарок коллеге', 'Прощальный подарок', 
  'На новоселье', 'День учителя', '8 марта', 'Выпускной'
];

const collectionDescriptions = [
  'Скидываемся на подарок к юбилею', 
  'Давайте соберем на хороший подарок',
  'Нужно порадовать человека чем-то особенным', 
  'Соберем деньги на общий подарок',
  'Предлагаю организовать сбор на памятный презент', 
  'Давно хотели подарить что-то стоящее',
  'Пришло время для действительно хорошего подарка', 
  'Особый случай заслуживает особого подарка',
  'Собираем на что-то запоминающееся', 
  'Нужен подарок, который останется в памяти'
];

const giftOptionTitles = [
  'Смартфон последней модели', 'Подарочный сертификат', 'Поездка на выходные', 
  'Ноутбук', 'Умные часы', 'Фотоаппарат', 'Консоль PlayStation', 
  'Набор косметики люкс', 'Ужин в ресторане', 'Электросамокат'
];

const giftOptionDescriptions = [
  'Самая последняя модель с хорошей камерой',
  'Сертификат в магазин электроники на любую сумму',
  'Двухдневная поездка в загородный отель с СПА',
  'Легкий и мощный для работы и развлечений',
  'С множеством функций для здоровья и спорта',
  'Профессиональная камера для качественных снимков',
  'Отличный подарок для геймера',
  'Набор премиальной косметики от известного бренда',
  'Сертификат на ужин в дорогом ресторане на двоих',
  'Современный и экологичный вид транспорта'
];

const chatCommands = [
  '/start',
  '/help',
  '/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...',
  '/group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)',
  '/join_collection [ID сбора]',
  '/pay [ID сбора] [сумма]',
  '/status [ID сбора]',
  '/collection_status [ID сбора]',
  '/confirm_gift [ID сбора]',
  '/cancel [ID сбора]',
  '/add_gift_option [ID сбора]|Название|Описание',
  '/vote [ID сбора] [ID варианта]',
  '/update_amount [ID сбора] [новая сумма]',
  '/send_reminders [ID сбора]'
];

// Функция для генерации случайного целого числа в диапазоне
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Функция для получения случайного элемента из массива
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Функция для генерации случайной даты в пределах N дней от сегодня
const getRandomDate = (daysRange: number): number => {
  const now = Date.now();
  const offset = getRandomInt(0, daysRange * 24 * 60 * 60 * 1000);
  return now - offset;
};

// Функция для генерации случайных пользователей
export const generateUsers = (count: number): User[] => {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = 100000 + i; // Уникальный ID пользователя
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const username = usernames[i % usernames.length];
    
    users.push({
      id,
      firstName,
      lastName,
      username,
      chatId: id, // В Telegram chatId для личных сообщений совпадает с userId
      createdAt: getRandomDate(30) // Создан в течение последних 30 дней
    });
  }
  
  return users;
};

// Функция для генерации групповых чатов
export const generateGroupChats = (count: number): { id: number, title: string }[] => {
  const chats = [];
  
  for (let i = 0; i < count; i++) {
    const id = -100000000 - i; // В Telegram групповые чаты имеют отрицательные ID
    const title = chatTitles[i % chatTitles.length];
    
    chats.push({
      id,
      title
    });
  }
  
  return chats;
};

// Функция для генерации коллекций
export const generateCollections = (users: User[], groupChats: { id: number, title: string }[]): Collection[] => {
  const collections: Collection[] = [];
  const statuses: CollectionStatus[] = ['pending', 'active', 'completed', 'cancelled', 'frozen'];
  
  for (let i = 0; i < 20; i++) {
    const id = uuidv4(); // Уникальный ID коллекции
    const title = getRandomElement(collectionTitles);
    const description = getRandomElement(collectionDescriptions);
    const targetAmount = getRandomInt(2000, 15000);
    
    // Случайный статус с приоритетом на активные коллекции
    const status = i < 10 ? 'active' : getRandomElement(statuses) as CollectionStatus;
    
    // Случайный организатор из списка пользователей
    const organizerId = users[getRandomInt(0, users.length - 1)].id;
    
    // Случайный получатель подарка из списка пользователей (не организатор)
    let giftRecipientId;
    do {
      giftRecipientId = users[getRandomInt(0, users.length - 1)].id;
    } while (giftRecipientId === organizerId);
    
    // Создае�� от 3 до 8 участников
    const participantsCount = getRandomInt(3, 8);
    const participants: CollectionParticipant[] = [];
    const usedUserIds = new Set<number>([organizerId]); // Организатор уже используется
    
    // Добавляем организатора как участника
    participants.push({
      userId: organizerId,
      collectionId: id,
      contribution: getRandomInt(500, 2000),
      hasPaid: true
    });
    
    // Добавляем остальных участников
    for (let j = 0; j < participantsCount - 1; j++) {
      let userId;
      do {
        userId = users[getRandomInt(0, users.length - 1)].id;
      } while (usedUserIds.has(userId));
      
      usedUserIds.add(userId);
      
      const hasPaid = Math.random() < 0.7; // 70% участников уже заплатили
      const contribution = hasPaid ? getRandomInt(500, 2000) : 0;
      
      participants.push({
        userId,
        collectionId: id,
        contribution,
        hasPaid
      });
    }
    
    // Рассчитываем текущую сумму сбора
    const currentAmount = participants.reduce((sum, p) => sum + p.contribution, 0);
    
    // Добавляем варианты подарков для голосования (от 0 до 4)
    const giftOptionsCount = getRandomInt(0, 4);
    const giftOptions: GiftOption[] = [];
    
    for (let j = 0; j < giftOptionsCount; j++) {
      const giftOption: GiftOption = {
        id: uuidv4(),
        collectionId: id,
        title: giftOptionTitles[j % giftOptionTitles.length],
        description: giftOptionDescriptions[j % giftOptionDescriptions.length],
        votes: getRandomInt(0, participants.length)
      };
      
      giftOptions.push(giftOption);
      
      // Распределяем голоса участников
      if (giftOption.votes > 0) {
        const votersCount = Math.min(giftOption.votes, participants.length);
        const shuffledParticipants = [...participants].sort(() => 0.5 - Math.random());
        
        for (let k = 0; k < votersCount; k++) {
          shuffledParticipants[k].vote = giftOption.id;
        }
      }
    }
    
    // Определяем, будет ли коллекция привязана к групповому чату
    const groupChatId = i % 3 === 0 ? groupChats[getRandomInt(0, groupChats.length - 1)].id : undefined;
    
    // Устанавливаем срок сбора (если он активный)
    const hasDeadline = Math.random() < 0.8; // 80% коллекций имеют срок
    const deadline = hasDeadline ? Date.now() + getRandomInt(1, 14) * 24 * 60 * 60 * 1000 : undefined;
    
    // Создаем коллекцию
    const collection: Collection = {
      id,
      title,
      description,
      targetAmount,
      currentAmount,
      status,
      organizerId,
      giftRecipientId,
      participants,
      groupChatId,
      giftOptions,
      deadline,
      createdAt: getRandomDate(14),  // Создана в течение последних 14 дней
      updatedAt: getRandomDate(7)    // Обновлена в течение последних 7 дней
    };
    
    collections.push(collection);
  }
  
  return collections;
};

// Функция для генерации транзакций на основе коллекций
export const generateTransactions = (collections: Collection[]): Transaction[] => {
  const transactions: Transaction[] = [];
  
  collections.forEach(collection => {
    collection.participants.forEach(participant => {
      if (participant.hasPaid && participant.contribution > 0) {
        // Для каждого платежа создаем транзакцию
        const transaction: Transaction = {
          id: uuidv4(),
          collectionId: collection.id,
          userId: participant.userId,
          amount: participant.contribution,
          type: 'contribution',
          timestamp: getRandomDate(14)  // Транзакция произошла в течение последних 14 дней
        };
        
        transactions.push(transaction);
        
        // С вероятностью 5% создаем отмененную транзакцию
        if (Math.random() < 0.05) {
          const cancelledTransaction: Transaction = {
            id: uuidv4(),
            collectionId: collection.id,
            userId: participant.userId,
            amount: getRandomInt(300, 1000),
            type: 'contribution',
            timestamp: getRandomDate(30),
            cancelled: true,
            cancelReason: 'Отменено пользователем',
            cancelledAt: getRandomDate(7)
          };
          
          transactions.push(cancelledTransaction);
        }
      }
    });
    
    // Для отмененных коллекций добавляем транзакции возврата
    if (collection.status === 'cancelled') {
      collection.participants.forEach(participant => {
        if (participant.hasPaid && participant.contribution > 0) {
          const refundTransaction: Transaction = {
            id: uuidv4(),
            collectionId: collection.id,
            userId: participant.userId,
            amount: participant.contribution,
            type: 'refund',
            timestamp: getRandomDate(7)  // Возврат произошел в течение последних 7 дней
          };
          
          transactions.push(refundTransaction);
        }
      });
    }
  });
  
  return transactions;
};

// Функция для генерации истории чатов
export const generateChatHistory = (
  users: User[], 
  groupChats: { id: number, title: string }[], 
  collections: Collection[]
): ChatHistory[] => {
  const chatHistory: ChatHistory[] = [];
  const now = Date.now();
  
  // Генерируем историю личных чатов с ботом
  users.forEach(user => {
    // От 0 до 10 сообщений для каждого пользователя
    const messageCount = getRandomInt(0, 10);
    
    for (let i = 0; i < messageCount; i++) {
      const timestamp = now - getRandomInt(0, 30 * 24 * 60 * 60 * 1000); // В пределах 30 дней
      
      // Команда от пользователя
      const command = getRandomElement(chatCommands);
      chatHistory.push({
        id: uuidv4(),
        chatId: user.chatId,
        userId: user.id,
        messageText: command,
        isFromUser: true,
        timestamp
      });
      
      // Ответ бота
      chatHistory.push({
        id: uuidv4(),
        chatId: user.chatId,
        messageText: `Бот обработал команду "${command.split(' ')[0]}" и отправил ответ.`,
        isFromUser: false,
        timestamp: timestamp + getRandomInt(1000, 5000) // Ответ через 1-5 секунд
      });
    }
  });
  
  // Генерируем историю групповых чатов
  groupChats.forEach(chat => {
    // От 5 до 20 сообщений для каждого группового чата
    const messageCount = getRandomInt(5, 20);
    
    for (let i = 0; i < messageCount; i++) {
      const timestamp = now - getRandomInt(0, 30 * 24 * 60 * 60 * 1000); // В пределах 30 дней
      const randomUser = getRandomElement(users);
      
      // Команда от пользователя
      const command = getRandomElement(chatCommands);
      chatHistory.push({
        id: uuidv4(),
        chatId: chat.id,
        userId: randomUser.id,
        messageText: command,
        isFromUser: true,
        timestamp
      });
      
      // Ответ бота
      chatHistory.push({
        id: uuidv4(),
        chatId: chat.id,
        messageText: `Бот обработал команду "${command.split(' ')[0]}" и отправил ответ в групповой чат "${chat.title}".`,
        isFromUser: false,
        timestamp: timestamp + getRandomInt(1000, 5000) // Ответ через 1-5 секунд
      });
    }
    
    // Добавляем сообщения о создании сборов в этом чате
    const collectionsInChat = collections.filter(c => c.groupChatId === chat.id);
    collectionsInChat.forEach(collection => {
      const timestamp = collection.createdAt;
      
      chatHistory.push({
        id: uuidv4(),
        chatId: chat.id,
        userId: collection.organizerId,
        messageText: `/group_new_collection ${collection.title}|${collection.description}|${collection.targetAmount}`,
        isFromUser: true,
        timestamp
      });
      
      chatHistory.push({
        id: uuidv4(),
        chatId: chat.id,
        messageText: `Сбор "${collection.title}" успешно создан в этом чате!\n\nЦель: ${collection.targetAmount} руб.\nСрок: ${collection.deadline ? new Date(collection.deadline).toLocaleDateString() : 'Не указан'}\n\nДля участия отправьте команду:\n/join_collection ${collection.id}`,
        isFromUser: false,
        timestamp: timestamp + getRandomInt(1000, 5000) // Ответ через 1-5 секунд
      });
    });
  });
  
  return chatHistory.sort((a, b) => a.timestamp - b.timestamp);
};

// Основная функция для генерации всех тестовых данных
export const generateAllTestData = () => {
  // Генерируем пользователей
  const users = generateUsers(30);
  
  // Генерируем групповые чаты
  const groupChats = generateGroupChats(10);
  
  // Генерируем коллекции
  const collections = generateCollections(users, groupChats);
  
  // Генерируем транзакции
  const transactions = generateTransactions(collections);
  
  // Генерируем историю чатов
  const chatHistory = generateChatHistory(users, groupChats, collections);
  
  return {
    users,
    groupChats,
    collections,
    transactions,
    chatHistory
  };
};
