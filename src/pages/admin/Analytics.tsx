
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { getCollections, getUsers, getTransactions, getLogEntries } from '@/services/storageService';
import { getDailyStats, getCollectionStats, getUserStats, getTransactionStats } from '@/services/adminService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = () => {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [collectionStats, setCollectionStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Load all stats
    loadStats();
  }, []);

  const loadStats = () => {
    // Get daily stats for charts
    const dailyStatsData = getDailyStats(14); // Last 14 days
    setDailyStats(dailyStatsData);

    // Get collection stats
    const colStats = getCollectionStats();
    setCollectionStats(colStats);

    // Get user stats
    const usrStats = getUserStats();
    setUserStats(usrStats);

    // Get transaction stats
    const txStats = getTransactionStats();
    setTransactionStats(txStats);

    // Create data for status pie chart
    const collections = getCollections();
    const statusCounts = collections.reduce((acc: any, collection) => {
      acc[collection.status] = (acc[collection.status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));
    setStatusData(statusChartData);

    // Get recent activity
    const logEntries = getLogEntries();
    const recentLogs = logEntries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(entry => {
        const user = getUsers().find(u => u.id === entry.userId);
        const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `User ${entry.userId}`;
        
        let description = '';
        
        if (entry.type.includes('transaction')) {
          const collection = getCollections().find(c => c.id === entry.collectionId);
          const amount = entry.amount || 0;
          description = `${userName} ${entry.type} ${amount} ₽ for collection "${collection?.title || 'Unknown'}"`;
        } else if (entry.type.includes('message')) {
          description = entry.isFromUser ? 
            `${userName} sent: "${entry.text?.substring(0, 50)}${entry.text && entry.text.length > 50 ? '...' : ''}"` : 
            `Bot sent to ${userName}: "${entry.text?.substring(0, 50)}${entry.text && entry.text.length > 50 ? '...' : ''}"`;
        } else {
          description = `${userName} ${entry.type}`;
        }
        
        return {
          id: entry.id,
          timestamp: entry.timestamp,
          description
        };
      });
    
    setRecentActivity(recentLogs);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Аналитика</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Сборы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{collectionStats?.total || 0}</div>
            <p className="text-xs text-gray-500">
              Активных: {collectionStats?.active || 0} | 
              Завершенных: {collectionStats?.completed || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{userStats?.total || 0}</div>
            <p className="text-xs text-gray-500">
              Активных: {userStats?.active || 0} | 
              Заблокированных: {userStats?.blocked || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Транзакции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{transactionStats?.total || 0}</div>
            <p className="text-xs text-gray-500">
              Сумма: {transactionStats?.netAmount || 0} ₽ | 
              Возвраты: {transactionStats?.refunds || 0}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Collections Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Сборы по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="collections" fill="#8884d8" name="Сборы" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Transactions Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Транзакции по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="transactions" fill="#82ca9d" name="Транзакции" />
                  <Bar dataKey="amount" fill="#ffc658" name="Сумма (₽)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Недавняя активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="border-b pb-2">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-500">Нет данных о недавней активности</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
