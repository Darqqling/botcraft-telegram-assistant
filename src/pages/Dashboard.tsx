
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut, 
  Send,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getUpdates, sendMessage, BotInfo } from "@/services/telegramService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [chatId, setChatId] = useState("");

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('telegram_bot_token');
    const botInfoStr = localStorage.getItem('telegram_bot_info');
    
    if (!token || !botInfoStr) {
      toast.error("Необходимо подключить бота");
      navigate('/');
      return;
    }

    setBotInfo(JSON.parse(botInfoStr));
    
    // Загружаем последние обновления
    loadUpdates();
    
    // Устанавливаем интервал для периодического обновления
    const interval = setInterval(loadUpdates, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const loadUpdates = async () => {
    try {
      const token = localStorage.getItem('telegram_bot_token');
      if (!token) return;
      
      setLoading(true);
      const data = await getUpdates(token);
      setUpdates(data.slice(-10).reverse()); // Берем последние 10 сообщений и разворачиваем их
    } catch (error) {
      console.error("Ошибка загрузки обновлений:", error);
      toast.error("Не удалось загрузить последние сообщения");
    } finally {
      setLoading(false);
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

  // Форматирование даты и времени
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-telegram" />
            <h1 className="text-xl font-semibold">
              {botInfo ? `@${botInfo.username}` : 'Telegram Bot'}
            </h1>
          </div>
          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Информация о боте */}
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
          
          {/* Отправка сообщения */}
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

        {/* Последние сообщения */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-telegram h-5 w-5" />
              <span>Последние сообщения</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadUpdates}
              disabled={loading}
            >
              {loading ? "Загрузка..." : "Обновить"}
            </Button>
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
      </div>
    </div>
  );
};

export default Dashboard;
