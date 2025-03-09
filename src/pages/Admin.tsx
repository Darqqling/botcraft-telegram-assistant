
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Gift, 
  DollarSign,
  MessageCircle,
  ClipboardList,
  Settings,
  UserPlus,
  Home,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Activity,
  CreditCard,
  UserMinus,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Bell,
  BarChart,
  Terminal
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState as useHookState } from '@hookform/resolvers/zod';

import ChatHistory from "./admin/ChatHistory";
import { initializeTestData, getCollections, getUsers, getTransactions, getGroupChats, getChatHistory } from "@/services/storageService";
import { Collection, User, Transaction } from "@/types/collectionTypes";
import { ChatHistory as ChatHistoryType, GroupChat, ChatStats } from "@/types/adminTypes";
import { sendMessage } from "@/services/telegramService";

const Admin = () => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [messageText, setMessageText] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCollections: 0,
    activeCollections: 0,
    totalTransactions: 0,
    totalAmount: 0,
    activeChatCount: 0
  });

  useEffect(() => {
    // Проверяем, были ли уже инициализированы тестовые данные
    const testDataInitialized = localStorage.getItem('test_data_initialized');
    setIsInitialized(testDataInitialized === 'true');
    
    if (testDataInitialized === 'true') {
      loadData();
    }
  }, []);

  useEffect(() => {
    if (collections.length && users.length && transactions.length) {
      calculateStats();
    }
  }, [collections, users, transactions, groupChats]);

  const calculateStats = () => {
    const activeCollections = collections.filter(c => c.status === 'active');
    const totalAmount = transactions.reduce((sum, t) => sum + (t.type === 'contribution' ? t.amount : 0), 0);
    const activeChatCount = groupChats.filter(c => c.isActive).length;
    
    setStats({
      totalUsers: users.length,
      totalCollections: collections.length,
      activeCollections: activeCollections.length,
      totalTransactions: transactions.length,
      totalAmount,
      activeChatCount
    });
  };

  const loadData = () => {
    setIsLoading(true);
    try {
      setCollections(getCollections());
      setUsers(getUsers());
      setTransactions(getTransactions());
      setGroupChats(getGroupChats());
      setChatHistory(getChatHistory());
      toast.success("Данные успешно загружены");
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast.error("Ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitTestData = () => {
    try {
      initializeTestData();
      localStorage.setItem('test_data_initialized', 'true');
      setIsInitialized(true);
      loadData();
      toast.success('Тестовые данные успешно инициализированы');
    } catch (error) {
      console.error('Ошибка при инициализации тестовых данных:', error);
      toast.error('Не удалось инициализировать тестовые данные');
    }
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'completed': return "bg-blue-100 text-blue-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      case 'frozen': return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return "Активен";
      case 'pending': return "Ожидает";
      case 'completed': return "Завершен";
      case 'cancelled': return "Отменен";
      case 'frozen': return "Заморожен";
      default: return status;
    }
  };

  const handleSendReminderToChat = async (chatId: number) => {
    try {
      const token = localStorage.getItem('telegram_bot_token');
      if (!token) {
        toast.error('Токен бота не найден');
        return;
      }
      
      if (!messageText) {
        toast.error('Введите текст сообщения');
        return;
      }

      await sendMessage(token, chatId, messageText);
      setMessageText("");
      toast.success('Сообщение успешно отправлено');
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      toast.error('Ошибка при отправке сообщения');
    }
  };

  const filteredCollections = collections
    .filter(collection => {
      // Фильтрация по статусу
      if (statusFilter !== "all" && collection.status !== statusFilter) {
        return false;
      }
      
      // Поиск по названию или описанию
      if (searchTerm && !collection.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          (!collection.description || !collection.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Сортировка по дате создания (новые сверху)

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const fullName = `${user.firstName} ${user.lastName || ''}`.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    
    return fullName.includes(searchTerm.toLowerCase()) || 
           username.includes(searchTerm.toLowerCase()) ||
           user.id.toString().includes(searchTerm);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="text-blue-600" />
            <h1 className="text-xl font-semibold">Панель администратора</h1>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleNavigateToDashboard}
          >
            <Home className="h-4 w-4" />
            <span>Вернуться в дашборд</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Инициализация тестовых данных */}
        {!isInitialized && (
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold mb-2">Инициализация тестовых данных</h2>
            <p className="mb-4 text-gray-700">
              Чтобы увидеть, как выглядит приложение с данными, необходимо инициализировать тестовый набор данных:
              пользователей, чаты, сборы, транзакции и историю сообщений.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleInitTestData}
            >
              Инициализировать тестовые данные
            </Button>
          </div>
        )}
        
        {isInitialized && (
          <>
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Активные сборы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold">{stats.activeCollections}</span>
                    <span className="text-sm text-gray-500 ml-2">из {stats.totalCollections}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold">{stats.totalUsers}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Собрано средств</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold">{stats.totalAmount} ₽</span>
                    <span className="text-sm text-gray-500 ml-2">{stats.totalTransactions} транзакций</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Вкладки интерфейса */}
        <Tabs defaultValue="chats" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>История чатов</span>
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span>Сборы</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Пользователи</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Транзакции</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Логи системы</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Администраторы</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Настройки</span>
            </TabsTrigger>
          </TabsList>

          {/* Вкладка истории чатов */}
          <TabsContent value="chats">
            <ChatHistory />
          </TabsContent>

          {/* Вкладка сборов */}
          <TabsContent value="collections">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Управление сборами</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск по названию..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="pending">Ожидающие</SelectItem>
                      <SelectItem value="completed">Завершенные</SelectItem>
                      <SelectItem value="cancelled">Отмененные</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="shrink-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Сбросить
                  </Button>
                </div>
              </div>
              
              {filteredCollections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCollections.map(collection => (
                    <Card key={collection.id} className="bg-gray-50 border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{collection.title}</CardTitle>
                          <Badge className={getStatusBadgeColor(collection.status)}>
                            {getStatusText(collection.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {collection.description && (
                          <p className="text-gray-600 mb-4">{collection.description}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Собрано:</span>
                            <span className="font-medium">
                              {collection.currentAmount} из {collection.targetAmount} ₽ 
                              ({Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Участников:</span>
                            <span>{collection.participants.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Срок:</span>
                            <span>
                              {collection.deadline 
                                ? new Date(collection.deadline).toLocaleDateString() 
                                : 'Не установлен'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCollection(collection)}
                        >
                          Подробнее
                        </Button>
                        
                        {collection.status === 'active' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <XCircle className="h-4 w-4 mr-1" />
                                Отменить
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Отмена сбора</DialogTitle>
                                <DialogDescription>
                                  Вы действительно хотите отменить сбор "{collection.title}"?
                                  Все участники будут уведомлены об отмене.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline">Отмена</Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => {
                                    toast.success(`Сбор "${collection.title}" отменен`);
                                  }}
                                >
                                  Подтвердить отмену
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading ? (
                    <p>Загрузка сборов...</p>
                  ) : (
                    <p>Сборы не найдены. Измените параметры поиска или создайте новый сбор.</p>
                  )}
                </div>
              )}
            </div>
            
            {selectedCollection && (
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-8 w-8"
                      onClick={() => setSelectedCollection(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold">Детали сбора</h2>
                  </div>
                  <Badge className={getStatusBadgeColor(selectedCollection.status)}>
                    {getStatusText(selectedCollection.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{selectedCollection.title}</h3>
                    {selectedCollection.description && (
                      <p className="text-gray-600 mb-4">{selectedCollection.description}</p>
                    )}
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between">
                        <span className="font-medium">ID сбора:</span>
                        <span>{selectedCollection.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Создан:</span>
                        <span>{new Date(selectedCollection.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Организатор:</span>
                        <span>
                          {users.find(u => u.id === selectedCollection.organizerId)?.firstName || 
                           `Пользователь ${selectedCollection.organizerId}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Получатель:</span>
                        <span>
                          {selectedCollection.giftRecipientId 
                            ? (users.find(u => u.id === selectedCollection.giftRecipientId)?.firstName || 
                               `Пользователь ${selectedCollection.giftRecipientId}`)
                            : 'Не указан'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Целевая сумма:</span>
                        <span>{selectedCollection.targetAmount} ₽</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Собрано:</span>
                        <span>
                          {selectedCollection.currentAmount} ₽ 
                          ({Math.round(selectedCollection.currentAmount / selectedCollection.targetAmount * 100)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Срок сбора:</span>
                        <span>
                          {selectedCollection.deadline 
                            ? new Date(selectedCollection.deadline).toLocaleDateString()
                            : 'Не установлен'}
                        </span>
                      </div>
                      {selectedCollection.groupChatId && (
                        <div className="flex justify-between">
                          <span className="font-medium">Групповой чат:</span>
                          <span>
                            {groupChats.find(c => c.id === selectedCollection.groupChatId)?.title || 
                             `Чат ${selectedCollection.groupChatId}`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {selectedCollection.giftOptions && selectedCollection.giftOptions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Варианты подарка:</h4>
                        <div className="space-y-2">
                          {selectedCollection.giftOptions.map(option => (
                            <div key={option.id} className="border p-3 rounded-md">
                              <div className="flex justify-between">
                                <span className="font-medium">{option.title}</span>
                                <Badge>{option.votes} голосов</Badge>
                              </div>
                              {option.description && (
                                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Участники сбора:</h4>
                    <div className="border rounded-md">
                      {selectedCollection.participants.length > 0 ? (
                        <div className="divide-y">
                          {selectedCollection.participants.map((participant, index) => {
                            const user = users.find(u => u.id === participant.userId);
                            return (
                              <div key={index} className="p-3 flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    {user 
                                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                                      : `Пользователь ${participant.userId}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {user?.username ? `@${user.username}` : `ID: ${participant.userId}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{participant.contribution} ₽</p>
                                  <p className="text-sm">
                                    {participant.hasPaid 
                                      ? <span className="text-green-600 flex items-center">
                                          <CheckCircle className="h-3 w-3 mr-1" /> Оплачено
                                        </span>
                                      : <span className="text-amber-600 flex items-center">
                                          <AlertTriangle className="h-3 w-3 mr-1" /> Ожидает оплаты
                                        </span>}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="p-4 text-center text-gray-500">Нет участников</p>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Транзакции:</h4>
                      <div className="border rounded-md">
                        {transactions.filter(t => t.collectionId === selectedCollection.id).length > 0 ? (
                          <div className="divide-y">
                            {transactions
                              .filter(t => t.collectionId === selectedCollection.id)
                              .sort((a, b) => b.timestamp - a.timestamp)
                              .map(transaction => {
                                const user = users.find(u => u.id === transaction.userId);
                                return (
                                  <div key={transaction.id} className="p-3 flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">
                                        {user 
                                          ? `${user.firstName} ${user.lastName || ''}`.trim()
                                          : `Пользователь ${transaction.userId}`}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(transaction.timestamp).toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`font-medium ${
                                        transaction.type === 'contribution' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {transaction.type === 'contribution' ? '+' : '-'}{transaction.amount} ₽
                                      </p>
                                      <Badge variant={transaction.type === 'contribution' ? 'default' : 'destructive'}>
                                        {transaction.type === 'contribution' ? 'Взнос' : 'Возврат'}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="p-4 text-center text-gray-500">Нет транзакций</p>
                        )}
                      </div>
                    </div>
                    
                    {selectedCollection.status === 'active' && (
                      <div className="mt-6 flex gap-2">
                        <Button 
                          variant="default" 
                          className="flex-1"
                          onClick={() => {
                            toast.success("Напоминания отправлены участникам");
                          }}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Отправить напоминания
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => {
                            toast.success(`Сбор "${selectedCollection.title}" отменен`);
                            setSelectedCollection(null);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Отменить сбор
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Вкладка пользователей */}
          <TabsContent value="users">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Пользователи</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <Input
                    placeholder="Поиск по имени, логину или ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-80"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map(user => (
                    <Card key={user.id} className="bg-gray-50 border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {user.firstName} {user.lastName || ''}
                        </CardTitle>
                        {user.username && (
                          <p className="text-gray-500">@{user.username}</p>
                        )}
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID:</span>
                            <span>{user.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Chat ID:</span>
                            <span>{user.chatId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Зарегистрирован:</span>
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-500">Блокировка:</span>
                            <Badge variant={user.isBlocked ? "destructive" : "outline"}>
                              {user.isBlocked ? "Заблокирован" : "Активен"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          Подробнее
                        </Button>
                        
                        {user.isBlocked ? (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => {
                              toast.success(`Пользователь ${user.firstName} разблокирован`);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Разблокировать
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              toast.success(`Пользователь ${user.firstName} заблокирован`);
                            }}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Блокировать
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading ? (
                    <p>Загрузка пользователей...</p>
                  ) : (
                    <p>Пользователи не найдены. Измените параметры поиска.</p>
                  )}
                </div>
              )}
            </div>
            
            {selectedUser && (
              <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-8 w-8"
                      onClick={() => setSelectedUser(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold">Детали пользователя</h2>
                  </div>
                  <Badge variant={selectedUser.isBlocked ? "destructive" : "default"}>
                    {selectedUser.isBlocked ? "Заблокирован" : "Активен"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      {selectedUser.firstName} {selectedUser.lastName || ''}
                    </h3>
                    {selectedUser.username && (
                      <p className="text-gray-600 mb-4">@{selectedUser.username}</p>
                    )}
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between">
                        <span className="font-medium">ID пользователя:</span>
                        <span>{selectedUser.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">ID чата:</span>
                        <span>{selectedUser.chatId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Дата регистрации:</span>
                        <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                      </div>
                      
                      {selectedUser.isBlocked && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium">Причина блокировки:</span>
                            <span>{selectedUser.blockReason || 'Не указана'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Дата блокировки:</span>
                            <span>
                              {selectedUser.blockedAt 
                                ? new Date(selectedUser.blockedAt).toLocaleString()
                                : 'Не указана'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Участие в сборах:</h4>
                        <Badge>
                          {collections.filter(c => 
                            c.organizerId === selectedUser.id || 
                            c.participants.some(p => p.userId === selectedUser.id)
                          ).length}
                        </Badge>
                      </div>
                      
                      <div className="border rounded-md">
                        {collections.filter(c => 
                          c.organizerId === selectedUser.id || 
                          c.participants.some(p => p.userId === selectedUser.id)
                        ).length > 0 ? (
                          <div className="divide-y">
                            {collections
                              .filter(c => 
                                c.organizerId === selectedUser.id || 
                                c.participants.some(p => p.userId === selectedUser.id)
                              )
                              .map(collection => {
                                const isOrganizer = collection.organizerId === selectedUser.id;
                                const participant = collection.participants.find(p => p.userId === selectedUser.id);
                                
                                return (
                                  <div key={collection.id} className="p-3">
                                    <div className="flex justify-between">
                                      <span className="font-medium">{collection.title}</span>
                                      <Badge className={getStatusBadgeColor(collection.status)}>
                                        {getStatusText(collection.status)}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between mt-1 text-sm">
                                      <span className="text-gray-600">
                                        {isOrganizer ? 'Организатор' : 'Участник'}
                                      </span>
                                      {participant && (
                                        <span className={participant.hasPaid ? 'text-green-600' : 'text-amber-600'}>
                                          {participant.contribution} ₽ 
                                          {participant.hasPaid ? ' (оплачено)' : ' (не оплачено)'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="p-4 text-center text-gray-500">Не участвует ни в одном сборе</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Транзакции:</h4>
                      <Badge>
                        {transactions.filter(t => t.userId === selectedUser.id).length}
                      </Badge>
                    </div>
                    
                    <div className="border rounded-md">
                      {transactions.filter(t => t.userId === selectedUser.id).length > 0 ? (
                        <div className="divide-y">
                          {transactions
                            .filter(t => t.userId === selectedUser.id)
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .map(transaction => {
                              const collection = collections.find(c => c.id === transaction.collectionId);
                              
                              return (
                                <div key={transaction.id} className="p-3">
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {collection?.title || `Сбор ${transaction.collectionId}`}
                                    </span>
                                    <span className={`font-medium ${
                                      transaction.type === 'contribution' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {transaction.type === 'contribution' ? '+' : '-'}{transaction.amount} ₽
                                    </span>
                                  </div>
                                  <div className="flex justify-between mt-1 text-sm">
                                    <span className="text-gray-600">
                                      {new Date(transaction.timestamp).toLocaleString()}
                                    </span>
                                    <Badge variant={transaction.type === 'contribution' ? 'default' : 'destructive'}>
                                      {transaction.type === 'contribution' ? 'Взнос' : 'Возврат'}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="p-4 text-center text-gray-500">Нет транзакций</p>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">История сообщений:</h4>
                      <div className="border rounded-md max-h-96 overflow-y-auto">
                        {chatHistory.filter(msg => msg.userId === selectedUser.id).length > 0 ? (
                          <div className="divide-y">
                            {chatHistory
                              .filter(msg => msg.userId === selectedUser.id)
                              .sort((a, b) => b.timestamp - a.timestamp)
                              .slice(0, 15)
                              .map(message => (
                                <div key={message.id} className="p-3">
                                  <div className="flex justify-between">
                                    <span className={message.isFromUser ? 'font-medium' : 'text-blue-600'}>
                                      {message.isFromUser ? 'Пользователь:' : 'Бот:'}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {new Date(message.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm whitespace-pre-wrap">
                                    {message.messageText.length > 150 
                                      ? `${message.messageText.substring(0, 150)}...` 
                                      : message.messageText}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="p-4 text-center text-gray-500">Нет истории сообщений</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={() => {
                          toast.success(`Сообщение отправлено пользователю ${selectedUser.firstName}`);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Отправить сообщение
                      </Button>
                      
                      {selectedUser.isBlocked ? (
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            toast.success(`Пользователь ${selectedUser.firstName} разблокирован`);
                            setSelectedUser(null);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Разблокировать
                        </Button>
                      ) : (
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => {
                            toast.success(`Пользователь ${selectedUser.firstName} заблокирован`);
                            setSelectedUser(null);
                          }}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Блокировать
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Вкладка транзакций */}
          <TabsContent value="transactions">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-xl font-semibold mb-4 md:mb-0">Управление транзакциями</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Input
                    placeholder="Поиск по ID пользователя или сбора..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-80"
                  />
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="contribution">Взносы</SelectItem>
                      <SelectItem value="refund">Возвраты</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Список транзакций */}
              <div className="border rounded-lg">
                {transactions
                  .filter(transaction => {
                    if (statusFilter !== "all" && transaction.type !== statusFilter) {
                      return false;
                    }
                    
                    if (searchTerm) {
                      return transaction.userId.toString().includes(searchTerm) || 
                             transaction.collectionId.includes(searchTerm);
                    }
                    
                    return true;
                  })
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 50)
                  .length > 0 ? (
                    <div className="divide-y">
                      {transactions
                        .filter(transaction => {
                          if (statusFilter !== "all" && transaction.type !== statusFilter) {
                            return false;
                          }
                          
                          if (searchTerm) {
                            return transaction.userId.toString().includes(searchTerm) || 
                                   transaction.collectionId.includes(searchTerm);
                          }
                          
                          return true;
                        })
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 50)
                        .map(transaction => {
                          const user = users.find(u => u.id === transaction.userId);
                          const collection = collections.find(c => c.id === transaction.collectionId);
                          
                          return (
                            <div key={transaction.id} className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                              <div className="sm:w-2/3">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                  <div className="font-medium">
                                    {user 
                                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                                      : `Пользователь ${transaction.userId}`}
                                    {user?.username && <span className="text-gray-500 text-sm ml-1">@{user.username}</span>}
                                  </div>
                                  <div>
                                    <Badge variant={transaction.type === 'contribution' ? 'default' : 'destructive'}>
                                      {transaction.type === 'contribution' ? 'Взнос' : 'Возврат'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                  Сбор: {collection?.title || `ID: ${transaction.collectionId}`}
                                </p>
                                
                                <p className="text-sm text-gray-600">
                                  Дата: {new Date(transaction.timestamp).toLocaleString()}
                                </p>
                              </div>
                              
                              <div className="sm:w-1/3 flex flex-row sm:flex-col justify-between sm:items-end">
                                <div className={`text-xl font-bold ${
                                  transaction.type === 'contribution' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'contribution' ? '+' : '-'}{transaction.amount} ₽
                                </div>
                                
                                {transaction.type === 'contribution' && !transaction.cancelled && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      toast.success("Транзакция отменена, средства возвращены");
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Отменить
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {isLoading ? (
                        <p>Загрузка транзакций...</p>
                      ) : (
                        <p>Транзакции не найдены. Измените параметры поиска.</p>
                      )}
                    </div>
                  )}
              </div>
              
              {/* Статистика транзакций */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Всего транзакций</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-2xl font-bold">{transactions.length}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Всего взносов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-2xl font-bold">
                        {transactions.filter(t => t.type === 'contribution').length}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {transactions
                          .filter(t => t.type === 'contribution')
                          .reduce((sum, t) => sum + t.amount, 0)} ₽
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Всего возвратов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <ArrowLeft className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-2xl font-bold">
                        {transactions.filter(t => t.type === 'refund').length}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {transactions
                          .filter(t => t.type === 'refund')
                          .reduce((sum, t) => sum + t.amount, 0)} ₽
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Вкладка логов системы */}
          <TabsContent value="logs">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Логи системы</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Terminal className="h-4 w-4 mr-2" />
                    Фильтр
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Обновить
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {chatHistory
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 50)
                    .map(log => {
                      const user = users.find(u => u.id === log.userId);
                      const userName = user 
                        ? `${user.firstName} ${user.lastName || ''}`.trim() 
                        : log.userId ? `User ${log.userId}` : 'Bot';
                      
                      return `[${new Date(log.timestamp).toLocaleString()}] [Chat ${log.chatId}] [${log.isFromUser ? 'FROM ' + userName : 'BOT'}] ${log.messageText.slice(0, 150)}${log.messageText.length > 150 ? '...' : ''}\n`;
                    }).join('')}
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* Вкладка администраторов */}
          <TabsContent value="admins">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Управление администраторами</h2>
              
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-4">Текущие администраторы</h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="font-medium">Администратор системы</p>
                      <p className="text-sm text-gray-600">Роль: супер-админ</p>
                    </div>
                    <Badge>Текущий пользователь</Badge>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="font-medium">Тестовый модератор</p>
                      <p className="text-sm text-gray-600">Роль: модератор</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <UserMinus className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Добавить администратора
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Логи действий администраторов</h3>
                
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between">
                      <p className="font-medium">Администратор системы</p>
                      <p className="text-sm text-gray-600">03.09.2025 14:32:45</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Отмена сбора #CD35729</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between">
                      <p className="font-medium">Тестовый модератор</p>
                      <p className="text-sm text-gray-600">03.09.2025 11:15:22</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Блокировка пользователя #14325</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between">
                      <p className="font-medium">Администратор системы</p>
                      <p className="text-sm text-gray-600">02.09.2025 16:48:10</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Инициализация тестовых данных</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Вкладка настроек */}
          <TabsContent value="settings">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Настройки бота</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="font-medium mb-4">Ограничения сборов</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="minAmount">Минимальная сумма сбора</Label>
                        <p className="text-sm text-gray-500">Нижний порог для создания сбора</p>
                      </div>
                      <Input
                        id="minAmount"
                        type="number"
                        placeholder="100"
                        className="w-[180px]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="maxAmount">Максимальная сумма сбора</Label>
                        <p className="text-sm text-gray-500">Верхний порог для создания сбора</p>
                      </div>
                      <Input
                        id="maxAmount"
                        type="number"
                        placeholder="100000"
                        className="w-[180px]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="defaultDuration">Стандартная длительность (дни)</Label>
                        <p className="text-sm text-gray-500">Срок сбора по умолчанию</p>
                      </div>
                      <Input
                        id="defaultDuration"
                        type="number"
                        placeholder="30"
                        className="w-[180px]"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-4">Напоминания</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="reminderDays">Частота напоминаний (дни)</Label>
                        <p className="text-sm text-gray-500">Через сколько дней отправлять напоминание</p>
                      </div>
                      <Input
                        id="reminderDays"
                        type="number"
                        placeholder="3"
                        className="w-[180px]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Автоматические напоминания</Label>
                        <p className="text-sm text-gray-500">Отправлять автоматические напоминания</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-4">Управление функциями</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Групповые сборы</Label>
                        <p className="text-sm text-gray-500">Разрешить создание сборов в групповых чатах</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Голосование за подарки</Label>
                        <p className="text-sm text-gray-500">Разрешить голосование за варианты подарков</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Статистика использования</Label>
                        <p className="text-sm text-gray-500">Собирать статистику использования бота</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-4">Данные и очистка</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Очистить тестовые данные</Label>
                        <p className="text-sm text-gray-500">Удалить все тестовые коллекции и транзакции</p>
                      </div>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Очистить
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Сохранить настройки</Label>
                        <p className="text-sm text-gray-500">Применить все изменения настроек</p>
                      </div>
                      <Button variant="default">
                        <Settings className="h-4 w-4 mr-1" />
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
