
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
  Home
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatHistory from "./admin/ChatHistory";
import { initializeTestData } from "@/services/storageService";

const Admin = () => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Проверяем, были ли уже инициализированы тестовые данные
    const testDataInitialized = localStorage.getItem('test_data_initialized');
    setIsInitialized(testDataInitialized === 'true');
  }, []);

  const handleInitTestData = () => {
    try {
      initializeTestData();
      localStorage.setItem('test_data_initialized', 'true');
      setIsInitialized(true);
      toast.success('Тестовые данные успешно инициализированы');
    } catch (error) {
      console.error('Ошибка при инициализации тестовых данных:', error);
      toast.error('Не удалось инициализировать тестовые данные');
    }
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

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

          {/* Заглушки для остальных вкладок */}
          <TabsContent value="collections">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Управление сборами</h2>
              <p className="text-gray-500">
                Здесь будет размещен интерфейс для управления сборами: просмотр, поиск, модерация и т.д.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
              <p className="text-gray-500">
                Здесь будет размещен интерфейс для управления пользователями: просмотр, блокировка, статистика и т.д.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Управление транзакциями</h2>
              <p className="text-gray-500">
                Здесь будет размещен интерфейс для управления транзакциями: просмотр, поиск, отмена и т.д.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Логи системы</h2>
              <p className="text-gray-500">
                Здесь будет размещен интерфейс для просмотра системных логов, действий администраторов и т.д.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Управление администраторами</h2>
              <p className="text-gray-500">
                Здесь будет размещен интерфейс для управления администраторами: добавление, удаление, изменение прав доступа.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Настройки бота</h2>
              <p className="text-gray-500">
                Здесь будет размещен интерфейс для настройки параметров бота, глобальных ограничений и т.д.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
