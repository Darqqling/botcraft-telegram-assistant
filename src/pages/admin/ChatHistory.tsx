
import { useState, useEffect } from 'react';
import { 
  Search, Users, Calendar, ArrowUpDown, MessageCircle, 
  BarChart2, Filter, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getChatHistory, getGroupChats, getGroupChatTitle, getUsers, getUserById, getCollections } from '@/services/storageService';
import { ChatHistory as ChatHistoryType } from '@/types/adminTypes';
import { User } from '@/types/collectionTypes';

const ChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ChatHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupChats, setGroupChats] = useState<{id: number, title: string}[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [privateChats, setPrivateChats] = useState<{id: number, title: string}[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedChatId, selectedUserId, sortOrder, chatHistory, activeTab]);

  const loadData = () => {
    setLoading(true);
    
    // Загружаем историю чатов
    const history = getChatHistory();
    setChatHistory(history);
    
    // Загружаем групповые чаты
    const chats = getGroupChats();
    setGroupChats(chats);
    
    // Загружаем пользователей
    const allUsers = getUsers();
    setUsers(allUsers);
    
    // Создаем список личных чатов на основе пользователей
    const personal = allUsers.map(user => ({
      id: user.chatId,
      title: `${user.firstName} ${user.lastName || ''}`
    }));
    setPrivateChats(personal);
    
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...chatHistory];
    
    // Фильтрация по типу чата (все/групповые/личные)
    if (activeTab === 'group') {
      filtered = filtered.filter(message => {
        const chatId = message.chatId;
        return chatId < 0; // Групповые чаты в Telegram имеют отрицательные ID
      });
    } else if (activeTab === 'private') {
      filtered = filtered.filter(message => {
        const chatId = message.chatId;
        return chatId > 0; // Личные чаты в Telegram имеют положительные ID
      });
    }
    
    // Фильтрация по конкретному чату
    if (selectedChatId !== 'all') {
      const chatIdNum = parseInt(selectedChatId);
      filtered = filtered.filter(message => message.chatId === chatIdNum);
    }
    
    // Фильтрация по пользователю
    if (selectedUserId !== 'all') {
      const userIdNum = parseInt(selectedUserId);
      filtered = filtered.filter(message => message.userId === userIdNum);
    }
    
    // Поиск по тексту сообщения
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(message => 
        message.messageText.toLowerCase().includes(query)
      );
    }
    
    // Сортировка по времени
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.timestamp - b.timestamp;
      } else {
        return b.timestamp - a.timestamp;
      }
    });
    
    setFilteredHistory(filtered);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  const getChatName = (chatId: number) => {
    if (chatId < 0) {
      // Групповой чат
      return getGroupChatTitle(chatId);
    } else {
      // Личный чат
      const user = getUserById(chatId);
      return user ? `${user.firstName} ${user.lastName || ''}` : `Пользователь ${chatId}`;
    }
  };

  const getUserName = (userId?: number) => {
    if (!userId) return 'Бот';
    const user = getUserById(userId);
    return user ? `${user.firstName} ${user.lastName || ''}` : `Пользователь ${userId}`;
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Формируем статистику по чатам
  const chatStats = () => {
    const stats: Record<number, { messages: number, commands: number, lastActivity: number }> = {};
    
    chatHistory.forEach(message => {
      if (!stats[message.chatId]) {
        stats[message.chatId] = {
          messages: 0,
          commands: 0,
          lastActivity: 0
        };
      }
      
      stats[message.chatId].messages++;
      
      if (message.isFromUser && message.messageText.startsWith('/')) {
        stats[message.chatId].commands++;
      }
      
      if (message.timestamp > stats[message.chatId].lastActivity) {
        stats[message.chatId].lastActivity = message.timestamp;
      }
    });
    
    return Object.entries(stats).map(([chatId, data]) => ({
      chatId: parseInt(chatId),
      name: getChatName(parseInt(chatId)),
      isGroup: parseInt(chatId) < 0,
      ...data
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">История чатов</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">Все чаты</TabsTrigger>
            <TabsTrigger value="group">Групповые</TabsTrigger>
            <TabsTrigger value="private">Личные</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Фильтры</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Поиск по сообщениям</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Чат</label>
                  <Select
                    value={selectedChatId}
                    onValueChange={(value) => setSelectedChatId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите чат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все чаты</SelectItem>
                      <SelectItem value="group_header" disabled className="font-bold">
                        Групповые чаты
                      </SelectItem>
                      {groupChats.map((chat) => (
                        <SelectItem key={chat.id} value={chat.id.toString()}>
                          {chat.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="private_header" disabled className="font-bold">
                        Личные чаты
                      </SelectItem>
                      {privateChats.map((chat) => (
                        <SelectItem key={chat.id} value={chat.id.toString()}>
                          {chat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Пользователь</label>
                  <Select
                    value={selectedUserId}
                    onValueChange={(value) => setSelectedUserId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите пользователя" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все пользователи</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Сортировка по времени</label>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between" 
                    onClick={toggleSortOrder}
                  >
                    {sortOrder === 'desc' ? 'Сначала новые' : 'Сначала старые'}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>История сообщений</span>
                <span className="text-sm font-normal">
                  Найдено: {filteredHistory.length} из {chatHistory.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Загрузка данных...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>Нет сообщений, соответствующих фильтрам</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-4 rounded-lg border ${
                        message.isFromUser ? 'bg-gray-50' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">
                          {message.isFromUser ? getUserName(message.userId) : 'Бот'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line">{message.messageText}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Чат: {getChatName(message.chatId)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="group" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Групповые чаты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupChats.map((chat) => {
                  // Фильтруем сообщения для этого чата
                  const chatMessages = chatHistory.filter(m => m.chatId === chat.id);
                  // Получаем коллекции, связанные с этим чатом
                  const collections = getCollections().filter(c => c.groupChatId === chat.id);
                  
                  return (
                    <Card key={chat.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 p-4">
                        <CardTitle className="text-lg">{chat.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>ID чата:</span>
                            <span className="font-mono">{chat.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Сообщений:</span>
                            <span>{chatMessages.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Сборов создано:</span>
                            <span>{collections.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Последняя активность:</span>
                            <span>
                              {chatMessages.length > 0 
                                ? formatDateTime(Math.max(...chatMessages.map(m => m.timestamp)))
                                : 'Нет данных'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedChatId(chat.id.toString());
                              setActiveTab('all');
                            }}
                          >
                            Просмотреть историю
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="private" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Личные чаты пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {privateChats.map((chat) => {
                  // Фильтруем сообщения для этого пользователя
                  const userMessages = chatHistory.filter(m => m.chatId === chat.id);
                  const user = getUserById(chat.id);
                  
                  if (!user) return null;
                  
                  return (
                    <Card key={chat.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 p-4">
                        <CardTitle className="text-lg">{user.firstName} {user.lastName || ''}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>ID пользователя:</span>
                            <span className="font-mono">{user.id}</span>
                          </div>
                          {user.username && (
                            <div className="flex justify-between">
                              <span>Username:</span>
                              <span>@{user.username}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Сообщений:</span>
                            <span>{userMessages.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Последняя активность:</span>
                            <span>
                              {userMessages.length > 0 
                                ? formatDateTime(Math.max(...userMessages.map(m => m.timestamp)))
                                : 'Нет данных'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedChatId(chat.id.toString());
                              setActiveTab('all');
                            }}
                          >
                            Просмотреть историю
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по чатам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <MessageCircle className="mx-auto h-8 w-8 mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{chatHistory.length}</div>
                        <p className="text-sm text-muted-foreground">Всего сообщений</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="mx-auto h-8 w-8 mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{groupChats.length}</div>
                        <p className="text-sm text-muted-foreground">Групповых чатов</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Filter className="mx-auto h-8 w-8 mb-2 text-purple-500" />
                        <div className="text-2xl font-bold">
                          {chatHistory.filter(m => m.isFromUser && m.messageText.startsWith('/')).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Команд выполнено</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Название чата</th>
                      <th className="text-center py-2">Тип</th>
                      <th className="text-center py-2">Сообщений</th>
                      <th className="text-center py-2">Команд</th>
                      <th className="text-right py-2">Последняя активность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chatStats().sort((a, b) => b.lastActivity - a.lastActivity).map((stat) => (
                      <tr key={stat.chatId} className="border-b hover:bg-gray-50">
                        <td className="py-2">{stat.name}</td>
                        <td className="text-center py-2">
                          {stat.isGroup ? 
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Группа
                            </span> : 
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Личный
                            </span>
                          }
                        </td>
                        <td className="text-center py-2">{stat.messages}</td>
                        <td className="text-center py-2">{stat.commands}</td>
                        <td className="text-right py-2">{formatDateTime(stat.lastActivity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatHistory;
