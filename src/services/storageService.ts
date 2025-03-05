
import { Collection, User, Transaction } from "@/types/collectionTypes";

// Ключи для localStorage
const COLLECTIONS_KEY = 'telegram_bot_collections';
const USERS_KEY = 'telegram_bot_users';
const TRANSACTIONS_KEY = 'telegram_bot_transactions';

// Получение коллекций
export const getCollections = (): Collection[] => {
  try {
    const collections = localStorage.getItem(COLLECTIONS_KEY);
    return collections ? JSON.parse(collections) : [];
  } catch (error) {
    console.error('Ошибка при получении коллекций:', error);
    return [];
  }
};

// Сохранение коллекций
export const saveCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error('Ошибка при сохранении коллекций:', error);
  }
};

// Получение коллекции по ID
export const getCollectionById = (id: string): Collection | undefined => {
  const collections = getCollections();
  return collections.find(collection => collection.id === id);
};

// Добавление или обновление коллекции
export const saveCollection = (collection: Collection): void => {
  const collections = getCollections();
  const index = collections.findIndex(c => c.id === collection.id);
  
  if (index >= 0) {
    collections[index] = collection;
  } else {
    collections.push(collection);
  }
  
  saveCollections(collections);
};

// Удаление коллекции
export const deleteCollection = (id: string): void => {
  const collections = getCollections();
  const filteredCollections = collections.filter(c => c.id !== id);
  saveCollections(filteredCollections);
};

// Получение пользователей
export const getUsers = (): User[] => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return [];
  }
};

// Сохранение пользователей
export const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Ошибка при сохранении пользователей:', error);
  }
};

// Получение пользователя по ID
export const getUserById = (id: number): User | undefined => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

// Добавление или обновление пользователя
export const saveUser = (user: User): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  
  saveUsers(users);
};

// Получение транзакций
export const getTransactions = (): Transaction[] => {
  try {
    const transactions = localStorage.getItem(TRANSACTIONS_KEY);
    return transactions ? JSON.parse(transactions) : [];
  } catch (error) {
    console.error('Ошибка при получении транзакций:', error);
    return [];
  }
};

// Сохранение транзакций
export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Ошибка при сохранении транзакций:', error);
  }
};

// Получение транзакций по ID коллекции
export const getTransactionsByCollectionId = (collectionId: string): Transaction[] => {
  const transactions = getTransactions();
  return transactions.filter(t => t.collectionId === collectionId);
};

// Добавление транзакции
export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
};
