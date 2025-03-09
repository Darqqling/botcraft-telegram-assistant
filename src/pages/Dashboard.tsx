import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut, 
  Send,
  Clock,
  Gift,
  DollarSign,
  BarChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUpdates, sendMessage, BotInfo } from "@/services/telegramService";
import { getCollections, getUsers, getTransactions } from "@/services/storageService";
import { processCommand } from "@/services/botCommandService";
import { Collection, User, Transaction } from "@/types/collectionTypes";

const Dashboard = () => {
  const navigate = useNavigate();
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [chatId, setChatId] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processingMessages, setProcessingMessages] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('telegram_bot_token');
    const botInfoStr = localStorage.getItem('telegram_bot_info');
    
    if (!token || !botInfoStr) {
      toast.error("Необходимо подключить бота");
      navigate('/');
      return;
    }

    setBotInfo(JSON.parse(botInfoStr));
    
    loadUpdates();
    loadLocalData();
    
    const updateInterval = setInterval(loadUpdates, 30000);
    const processInterval = setInterval(processNewMessages, 15000);
    
    return () => {
      clearInterval(updateInterval);
      clearInterval(processInterval);
    };
  }, [navigate]);

  const loadLocalData = () => {
    setCollections(getCollections());
    setUsers(getUsers());
    setTransactions(getTransactions());
  };

  const loadUpdates = async () => {
    try {
      const token = localStorage.getItem('telegram_bot_token');
      if (!token) return;
      
      setLoading(true);
      const data = await getUpdates(token);
      setUpdates(data.slice(-10).reverse());
    } catch (error) {
      console.error("Ошибка загрузки обновлений:", error);
      toast.error("Не удалось загрузить последние сообщения");
    } finally {
      setLoading(false);
    }
  };

  const processNewMessages = async () => {
    if (processingMessages) return;
    
    try {
      const token = localStorage.getItem('telegram_bot_token');
      if (!token) return;
      
      setProcessingMessages(true);
      
      const data = await getUpdates(token);
      
      for (const update of data) {
        if (update.message?.text && typeof update.message.text === 'string' && update.message.text.startsWith('/')) {
          const response = await processCommand(token, update.message);
          
          if (response) {
            await sendMessage(token, update.message.chat.id, response);
          }
        }
      }
      
      loadLocalData();
    } catch (error) {
      console.error("Ошибка обработки сообщений:", error);
    } finally {
      setProcessingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText || !chatId) {
      toast.error("Введите текст сообщения и ID чата");
      return;
    }
    
    try {
      const token = localStorage.getItem('telegram_bot_token');
      if (!token) return;
      
      await sendMessage(token, chatId, messageText);
      toast.success("Сообщение отправлено");
      setMessageText("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      toast.error("Не удалось отправить сообщение");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('telegram_bot_token');
    localStorage.removeItem('telegram_bot_info');
    navigate('/');
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getCollectionStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'active': return 'Активен';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Пользователь ${userId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-telegram" />
            <h1 className="text-xl font-semibold">
              {botInfo ? `@${botInfo.username}` : 'Telegram Bot'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Админка
            </Button>
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="w-full flex justify-start mb-4">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>Сообщения</span>
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
          </TabsList>

          <TabsContent value="messages">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="text-telegram h-5 w-5" />
                    <span>Информация о боте</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {botInfo && (
                    <div className="space-y-2">
                      <p><strong>Имя:</strong> {botInfo.first_name}</p>
                      <p><strong>Username:</strong> @{botInfo.username}</p>
                      <p><strong>ID:</strong> {botInfo.id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="text-telegram h-5 w-5" />
                    <span>Отправка сообщения</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">ID чата</label>
                      <Input 
                        type="text" 
                        placeholder="Введите ID чата" 
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Текст сообщения</label>
                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          placeholder="Введите сообщение" 
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                        />
                        <Button 
                          className="bg-telegram hover:bg-telegram-hover"
                          onClick={handleSendMessage}
                        >
                          Отправить
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-telegram h-5 w-5" />
                  <span>Последние сообщения</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={processNewMessages}
                    disabled={processingMessages}
                  >
                    {processingMessages ? "Обработка..." : "Обработать команды"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadUpdates}
                    disabled={loading}
                  >
                    {loading ? "Загрузка..." : "Обновить"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {updates.length > 0 ? (
                  <div className="space-y-4">
                    {updates.map((update, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">
                            {update.message?.from?.first_name} {update.message?.from?.last_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {update.message?.date && formatDateTime(update.message.date)}
                          </span>
                        </div>
                        <p>{update.message?.text}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          Chat ID: {update.message?.chat?.id}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    Пока нет сообщений или обновлений
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="text-telegram h-5 w-5" />
                  <span>Активные сборы</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadLocalData}
                >
                  Обновить
                </Button>
              </CardHeader>
              <CardContent>
                {collections.length > 0 ? (
                  <div className="space-y-4">
                    {collections.map((collection) => (
                      <div key={collection.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{collection.title}</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            collection.status === 'active' ? 'bg-green-100 text-green-800' :
                            collection.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            collection.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getCollectionStatus(collection.status)}
                          </span>
                        </div>
                        
                        {collection.description && (
                          <p className="text-gray-600 mb-2">{collection.description}</p>
                        )}
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between">
                            <span>Собрано:</span>
                            <span className="font-medium">{collection.currentAmount} из {collection.targetAmount} руб. ({Math.round(collection.currentAmount / collection.targetAmount * 100)}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Организатор:</span>
                            <span>{getUserName(collection.organizerId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Участников:</span>
                            <span>{collection.participants.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Создан:</span>
                            <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Участники:</h4>
                          <div className="space-y-2">
                            {collection.participants.map((participant, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{getUserName(participant.userId)}</span>
                                <span className={participant.hasPaid ? 'text-green-600' : 'text-gray-400'}>
                                  {participant.contribution} руб. {participant.hasPaid ? '✓' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    Пока нет созданных сборов
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="text-telegram h-5 w-5" />
                  <span>Пользователи</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="font-medium mb-2">{user.firstName} {user.lastName || ''}</div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {user.username && <p>@{user.username}</p>}
                          <p>ID: {user.id}</p>
                          <p>Chat ID: {user.chatId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    Пока нет пользователей в системе
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="text-telegram h-5 w-5" />
                  <span>Транзакции</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{getUserName(transaction.userId)}</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            transaction.type === 'contribution' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'contribution' ? 'Взнос' : 'Возврат'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between">
                            <span>Сумма:</span>
                            <span className="font-medium">{transaction.amount} руб.</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Дата:</span>
                            <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ID сбора:</span>
                            <span className="text-telegram">{transaction.collectionId}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    Пока нет транзакций
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
