
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { getMe } from "@/services/telegramService";
import { useNavigate } from "react-router-dom";

const BotConnect = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (!token) {
      toast.error("Пожалуйста, введите токен бота");
      return;
    }
    
    setLoading(true);
    
    try {
      // Проверяем токен, запрашивая информацию о боте
      const botInfo = await getMe(token);
      
      // Сохраняем токен и информацию о боте в localStorage
      localStorage.setItem('telegram_bot_token', token);
      localStorage.setItem('telegram_bot_info', JSON.stringify(botInfo));
      
      toast.success(`Бот @${botInfo.username} успешно подключен!`);
      
      // Перенаправляем на панель управления
      navigate('/dashboard');
    } catch (error) {
      console.error('Ошибка при подключении бота:', error);
      toast.error("Ошибка подключения. Проверьте токен и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-6 animate-fade-in">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <MessageCircle size={40} className="text-telegram" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Подключите вашего бота
          </h1>
          <p className="text-sm text-gray-500">
            Введите токен бота, полученный от @BotFather
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Введите токен бота"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            className="w-full bg-telegram hover:bg-telegram-hover transition-colors"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? "Подключение..." : "Подключить бота"}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          Не знаете как получить токен? 
          <a 
            href="https://core.telegram.org/bots#how-do-i-create-a-bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-telegram hover:underline ml-1"
          >
            Инструкция
          </a>
        </p>
      </Card>
    </div>
  );
};

export default BotConnect;
