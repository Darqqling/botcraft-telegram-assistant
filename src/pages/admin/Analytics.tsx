
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getCollections, getUsers, getTransactions, getLogEntries, getChatHistory } from '@/services/storageService';
import { Collection, Transaction } from '@/types/collectionTypes';
import { Activity, BarChart3, CircleUser, DollarSign } from 'lucide-react';

const Analytics = () => {
  const [collectionsData, setCollectionsData] = useState<Collection[]>([]);
  const [collectionsByDay, setCollectionsByDay] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [avgCollectionSize, setAvgCollectionSize] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Загрузка данных
    const collections = getCollections();
    const users = getUsers();
    const transactions = getTransactions();
    const logs = getLogEntries();
    const chatHistory = getChatHistory();
    
    setCollectionsData(collections);
    
    // Расчет средней суммы сбора
    if (collections.length > 0) {
      const totalAmount = collections.reduce((acc, curr) => acc + curr.targetAmount, 0);
      setAvgCollectionSize(Math.round(totalAmount / collections.length));
    }
    
    // Подсчет активных пользователей (вносивших средства за последние 30 дней)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentTransactions = transactions.filter(t => t.timestamp > thirtyDaysAgo);
    const uniqueUsers = new Set(recentTransactions.map(t => t.userId));
    setActiveUsers(uniqueUsers.size);
    
    // Построение данных для графика сборов по дням
    const collectionsByDayMap = new Map();
    collections.forEach(collection => {
      const date = new Date(collection.createdAt).toLocaleDateString();
      if (collectionsByDayMap.has(date)) {
        collectionsByDayMap.set(date, collectionsByDayMap.get(date) + 1);
      } else {
        collectionsByDayMap.set(date, 1);
      }
    });
    
    const collectionsByDayArray = Array.from(collectionsByDayMap).map(([date, count]) => ({
      date,
      count
    }));
    
    setCollectionsByDay(collectionsByDayArray);
    
    // Распределение сборов по статусам
    const statusCounts = collections.reduce((acc: Record<string, number>, collection) => {
      const status = collection.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const statusDistributionArray = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
    
    setStatusDistribution(statusDistributionArray);
    
    // Последние активности
    const allActivity = [
      ...transactions.map(t => ({
        type: 'transaction',
        userId: t.userId,
        timestamp: t.timestamp,
        amount: t.amount,
        collectionId: t.collectionId
      })),
      ...chatHistory.slice(-50).map(msg => ({
        type: 'message',
        userId: msg.userId,
        timestamp: msg.timestamp,
        text: msg.messageText,
        chatId: msg.chatId,
        isFromUser: msg.isFromUser
      }))
    ];
    
    allActivity.sort((a, b) => b.timestamp - a.timestamp);
    
    const recentActivityData = allActivity.slice(0, 10).map(activity => {
      const user = users.find(u => u.id === activity.userId);
      const collection = collections.find(c => c.id === activity.collectionId);
      
      let description = '';
      if (activity.type === 'transaction') {
        description = `${user ? user.firstName : 'User'} paid ${activity.amount} for "${collection ? collection.title : 'collection'}"`;
      } else {
        description = activity.isFromUser 
          ? `${user ? user.firstName : 'User'} sent: ${activity.text}`
          : `Bot replied: ${activity.text.substring(0, 50)}...`;
      }
      
      return {
        timestamp: new Date(activity.timestamp).toLocaleString(),
        description,
        type: activity.type
      };
    });
    
    setRecentActivity(recentActivityData);
    
  }, []);

  // Цвета для диаграммы статусов
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Аналитика</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
            <CircleUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              за последние 30 дней
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний размер сбора</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCollectionSize} руб.</div>
            <p className="text-xs text-muted-foreground">
              на основе {collectionsData.length} сборов
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сборов</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionsData.length}</div>
            <p className="text-xs text-muted-foreground">
              в системе
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Сборы по дням</CardTitle>
            <CardDescription>Количество созданных сборов</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <BarChart width={500} height={300} data={collectionsByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Количество сборов" fill="#8884d8" />
              </BarChart>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Статусы сборов</CardTitle>
            <CardDescription>Распределение сборов по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex justify-center">
              <PieChart width={400} height={300}>
                <Pie
                  data={statusDistribution}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Последняя активность
          </CardTitle>
          <CardDescription>История последних действий в системе</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex justify-between items-start pb-2 border-b border-gray-100">
                <div className="text-sm">
                  <span className="font-semibold">{activity.timestamp}</span>
                  <p className="mt-1 text-gray-600">{activity.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                  {activity.type === 'transaction' ? 'Платеж' : 'Сообщение'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
