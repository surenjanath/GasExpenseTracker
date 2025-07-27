import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/lib/auth';

interface AnalyticsData {
  monthlyExpenses: number;
  yearlyExpenses: number;
  totalGallons: number;
  avgMpg: number;
  nextService: string;
  serviceMileage: number;
  fuelTrends: { date: string; amount: number }[];
  costTrends: { date: string; cost: number }[];
  vehicleStats: {
    make: string;
    model: string;
    currentMileage: number;
  };
  monthlyComparison: {
    current: number;
    previous: number;
    change: number;
  };
  serviceHistory: {
    date: string;
    type: string;
    mileage: number;
  }[];
  fuelEfficiencyTrend: {
    date: string;
    mpg: number;
  }[];
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  maintenancePredictions: {
    type: string;
    predictedDate: string;
    predictedMileage: number;
    confidence: number;
  }[];
  averageFuelPrice: number;
  bestMpg: number;
  worstMpg: number;
  userInfo: {
    name: string;
  };
  environmentalImpact: {
    co2Emissions: number;
    treesNeeded: number;
    carbonOffsetCost: number;
  };
  maintenanceCosts: {
    total: number;
    monthly: number;
    yearly: number;
    byCategory: {
      category: string;
      amount: number;
    }[];
  };
  costSavings: {
    potential: number;
    recommendations: string[];
  };
  drivingBehavior: {
    averageDailyMileage: number;
    averageDaysBetweenRefuels: number;
    weekdayVsWeekend: {
      weekday: number;
      weekend: number;
    };
    refuelingPatterns: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
  };
  costOptimization: {
    bestGasStations: Array<{
      name: string;
      averagePrice: number;
      visits: number;
    }>;
    priceTrends: {
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
      sunday: number;
    };
    costPerMile: number;
    optimalRefuelingTime: string;
  };
  vehicleHealth: {
    maintenanceTrend: {
      last3Months: number;
      last6Months: number;
      lastYear: number;
    };
    nextServicePredictions: Array<{
      type: string;
      predictedDate: string;
      confidence: number;
    }>;
    tireWearEstimate: number;
    batteryHealth: string;
  };
  environmentalScore: {
    ecoDrivingScore: number;
    weatherImpact: {
      sunny: number;
      rainy: number;
      cold: number;
    };
    savingsPotential: {
      monthly: number;
      yearly: number;
    };
  };
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch user's information
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Fetch user's vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .single();

      console.log('Vehicles data:', vehicles);

      // Fetch fuel expenses
      const { data: fuelExpenses = [] } = await supabase
        .from('fuel_expenses')
        .select('*')
        .order('date', { ascending: true });

      console.log('Fuel expenses data:', fuelExpenses);

      // Fetch service records
      const { data: serviceRecords = [] } = await supabase
        .from('service_records')
        .select('*')
        .order('date', { ascending: true });

      console.log('Service records data:', serviceRecords);

      // Process data
      const processedData: AnalyticsData = {
        monthlyExpenses: calculateMonthlyExpenses(fuelExpenses || []),
        yearlyExpenses: calculateYearlyExpenses(fuelExpenses || []),
        totalGallons: calculateTotalGallons(fuelExpenses || []),
        avgMpg: calculateAverageMPG(fuelExpenses || []),
        nextService: calculateNextService(vehicles, serviceRecords || []),
        serviceMileage: vehicles?.next_service_mileage || 0,
        fuelTrends: processFuelTrends(fuelExpenses || []),
        costTrends: processCostTrends(fuelExpenses || []),
        vehicleStats: {
          make: vehicles?.make || '',
          model: vehicles?.model || '',
          currentMileage: vehicles?.current_mileage || 0,
        },
        monthlyComparison: calculateMonthlyComparison(fuelExpenses || []),
        serviceHistory: processServiceHistory(serviceRecords || []),
        fuelEfficiencyTrend: calculateFuelEfficiencyTrend(fuelExpenses || []),
        costBreakdown: calculateCostBreakdown(fuelExpenses || []),
        maintenancePredictions: calculateMaintenancePredictions(vehicles, serviceRecords || []),
        averageFuelPrice: calculateAverageFuelPrice(fuelExpenses || []),
        bestMpg: calculateMpgExtremes(fuelExpenses || []).bestMpg,
        worstMpg: calculateMpgExtremes(fuelExpenses || []).worstMpg,
        userInfo: {
          name: userProfile?.full_name || 'User'
        },
        environmentalImpact: calculateEnvironmentalImpact(fuelExpenses || []),
        maintenanceCosts: calculateMaintenanceCosts(serviceRecords || []),
        costSavings: calculateCostSavings(fuelExpenses || [], vehicles),
        drivingBehavior: calculateDrivingBehavior(fuelExpenses || [], serviceRecords || []),
        costOptimization: calculateCostOptimization(fuelExpenses || []),
        environmentalScore: calculateEnvironmentalScore(fuelExpenses || [], vehicles),
      };

      console.log('Processed analytics data:', processedData);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for data processing
  const calculateMonthlyExpenses = (expenses: any[]) => {
    console.log('Calculating monthly expenses for:', expenses);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses
      .filter(expense => {
        const date = new Date(expense.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + Number(expense.total || 0), 0);
    console.log('Monthly expenses result:', monthlyExpenses);
    return monthlyExpenses;
  };

  const calculateYearlyExpenses = (expenses: any[]) => {
    console.log('Calculating yearly expenses for:', expenses);
    const currentYear = new Date().getFullYear();
    const yearlyExpenses = expenses
      .filter(expense => new Date(expense.date).getFullYear() === currentYear)
      .reduce((sum, expense) => sum + Number(expense.total || 0), 0);
    console.log('Yearly expenses result:', yearlyExpenses);
    return yearlyExpenses;
  };

  const calculateTotalGallons = (expenses: any[]) => {
    console.log('Calculating total gallons for:', expenses);
    const totalGallons = expenses.reduce((sum, expense) => sum + Number(expense.gallons || 0), 0);
    console.log('Total gallons result:', totalGallons);
    return totalGallons;
  };

  const calculateAverageMPG = (expenses: any[]) => {
    console.log('Calculating average MPG for:', expenses);
    if (expenses.length < 2) return 0;
    let totalMiles = 0;
    let totalGallons = 0;
    
    for (let i = 1; i < expenses.length; i++) {
      const miles = Number(expenses[i].mileage || 0) - Number(expenses[i-1].mileage || 0);
      const gallons = Number(expenses[i].gallons || 0);
      totalMiles += miles;
      totalGallons += gallons;
    }
    
    const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
    console.log('Average MPG result:', avgMpg);
    return avgMpg;
  };

  const calculateNextService = (vehicle: any, serviceRecords: any[]) => {
    if (!vehicle) return 'No vehicle data';
    const nextServiceMileage = Number(vehicle.next_service_mileage);
    const currentMileage = Number(vehicle.current_mileage);
    const milesUntilService = nextServiceMileage - currentMileage;
    
    if (milesUntilService <= 0) return 'Service Due Now';
    return `${milesUntilService.toLocaleString('en-US')} miles until next service`;
  };

  const calculateMonthlyComparison = (expenses: any[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthExpenses = expenses
      .filter(expense => {
        const date = new Date(expense.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + Number(expense.total || 0), 0);

    const previousMonthExpenses = expenses
      .filter(expense => {
        const date = new Date(expense.date);
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
      })
      .reduce((sum, expense) => sum + Number(expense.total || 0), 0);

    const change = previousMonthExpenses > 0 
      ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
      : 0;

    return {
      current: currentMonthExpenses,
      previous: previousMonthExpenses,
      change,
    };
  };

  const processFuelTrends = (expenses: any[]) => {
    return expenses.map(expense => ({
      date: new Date(expense.date).toLocaleDateString('en-US'),
      amount: Number(expense.gallons || 0),
    }));
  };

  const processCostTrends = (expenses: any[]) => {
    return expenses.map(expense => ({
      date: new Date(expense.date).toLocaleDateString('en-US'),
      cost: Number(expense.total || 0),
    }));
  };

  const processServiceHistory = (records: any[]) => {
    return records.map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US'),
      type: record.service_type,
      mileage: Number(record.mileage),
    }));
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      style: 'percent'
    });
  };

  const getChartData = (data: { date: string; amount?: number; cost?: number }[] | undefined) => {
    if (!data || data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }

    return {
      labels: data.map(item => item.date),
      datasets: [{
        data: data.map(item => item.amount ?? item.cost ?? 0)
      }]
    };
  };

  const calculateFuelEfficiencyTrend = (expenses: any[]) => {
    const trend = [];
    for (let i = 1; i < expenses.length; i++) {
      const miles = Number(expenses[i].mileage) - Number(expenses[i-1].mileage);
      const gallons = Number(expenses[i].gallons);
      if (gallons > 0) {
        trend.push({
          date: new Date(expenses[i].date).toLocaleDateString('en-US'),
          mpg: miles / gallons
        });
      }
    }
    return trend;
  };

  const calculateCostBreakdown = (expenses: any[]) => {
    const totalCost = expenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0);
    const breakdown = expenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleString('en-US', { month: 'long' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += Number(expense.total || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount: Number(amount),
      percentage: totalCost > 0 ? (Number(amount) / totalCost) * 100 : 0
    }));
  };

  const calculateMaintenancePredictions = (vehicle: any, serviceRecords: any[]) => {
    if (!vehicle) return [];
    
    const predictions = [];
    const currentMileage = Number(vehicle.current_mileage);
    const averageDailyMiles = 30; // This could be calculated from actual data
    
    // Oil change prediction
    const lastOilChange = serviceRecords
      .filter(record => record.service_type === 'Oil Change')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
    if (lastOilChange) {
      const milesSinceLastChange = currentMileage - Number(lastOilChange.mileage);
      const predictedMilesUntilNext = 5000 - milesSinceLastChange; // Assuming 5000 mile interval
      const predictedDays = predictedMilesUntilNext / averageDailyMiles;
      
      predictions.push({
        type: 'Oil Change',
        predictedDate: new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        predictedMileage: currentMileage + predictedMilesUntilNext,
        confidence: 0.8
      });
    }

    return predictions;
  };

  const calculateMpgExtremes = (expenses: any[]) => {
    let bestMpg = 0;
    let worstMpg = Infinity;
    
    for (let i = 1; i < expenses.length; i++) {
      const miles = Number(expenses[i].mileage) - Number(expenses[i-1].mileage);
      const gallons = Number(expenses[i].gallons);
      if (gallons > 0) {
        const mpg = miles / gallons;
        bestMpg = Math.max(bestMpg, mpg);
        worstMpg = Math.min(worstMpg, mpg);
      }
    }
    
    return {
      bestMpg: bestMpg === 0 ? 0 : bestMpg,
      worstMpg: worstMpg === Infinity ? 0 : worstMpg
    };
  };

  const calculateAverageFuelPrice = (expenses: any[]) => {
    if (expenses.length === 0) return 0;
    const totalCost = expenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0);
    const totalGallons = expenses.reduce((sum, expense) => sum + Number(expense.gallons || 0), 0);
    return totalGallons > 0 ? totalCost / totalGallons : 0;
  };

  const calculateEnvironmentalImpact = (expenses: any[]) => {
    // Average CO2 emissions per gallon of gasoline: 8.887 kg
    const CO2_PER_GALLON = 8.887;
    const TREES_PER_TON_CO2 = 0.5; // Trees needed to offset 1 ton of CO2
    const CARBON_OFFSET_PRICE = 20; // $ per ton of CO2
    
    const totalGallons = expenses.reduce((sum, expense) => sum + Number(expense.gallons || 0), 0);
    const co2Emissions = totalGallons * CO2_PER_GALLON;
    const treesNeeded = (co2Emissions / 1000) * TREES_PER_TON_CO2;
    const carbonOffsetCost = (co2Emissions / 1000) * CARBON_OFFSET_PRICE;
    
    return {
      co2Emissions,
      treesNeeded,
      carbonOffsetCost
    };
  };

  const calculateMaintenanceCosts = (records: any[]) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const yearlyCosts = records
      .filter(record => new Date(record.date).getFullYear() === currentYear)
      .reduce((sum, record) => sum + Number(record.cost || 0), 0);
    
    const monthlyCosts = records
      .filter(record => {
        const date = new Date(record.date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .reduce((sum, record) => sum + Number(record.cost || 0), 0);
    
    const totalCosts = records.reduce((sum, record) => sum + Number(record.cost || 0), 0);
    
    const byCategory = records.reduce((acc, record) => {
      const category = record.description.split(' - ')[0] || 'Other';
      acc[category] = (acc[category] || 0) + Number(record.cost || 0);
      return acc;
    }, {});
    
    return {
      total: totalCosts,
      monthly: monthlyCosts,
      yearly: yearlyCosts,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        amount: Number(amount)
      }))
    };
  };

  const calculateCostSavings = (expenses: any[], vehicle: any) => {
    if (!vehicle || expenses.length < 2) return {
      potential: 0,
      recommendations: []
    };
    
    const recommendations = [];
    let potentialSavings = 0;
    
    // Check for price variations
    const prices = expenses.map(e => Number(e.price_per_unit || 0));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    
    if (maxPrice - minPrice > 0.5) {
      recommendations.push(`You could save up to $${(maxPrice - minPrice).toFixed(2)} per gallon by shopping around for better prices.`);
      potentialSavings += (maxPrice - minPrice) * expenses.reduce((sum, e) => sum + Number(e.gallons || 0), 0);
    }
    
    // Check for fuel efficiency
    const mpg = calculateAverageMPG(expenses);
    const vehicleMPG = vehicle?.mpg || 0;
    
    if (mpg < vehicleMPG * 0.9) {
      recommendations.push(`Improving your driving habits could help you achieve the vehicle's rated MPG of ${vehicleMPG}.`);
      potentialSavings += (vehicleMPG - mpg) * avgPrice * expenses.reduce((sum, e) => sum + Number(e.gallons || 0), 0);
    }
    
    return {
      potential: potentialSavings,
      recommendations
    };
  };

  const calculateDrivingBehavior = (expenses: any[], serviceRecords: any[]) => {
    if (!expenses.length) return null;
    
    // Calculate average daily mileage
    const totalMiles = expenses[expenses.length - 1].mileage - expenses[0].mileage;
    const days = (new Date(expenses[expenses.length - 1].date).getTime() - 
                 new Date(expenses[0].date).getTime()) / (1000 * 60 * 60 * 24);
    const averageDailyMileage = totalMiles / days;

    // Calculate days between refuels
    const daysBetweenRefuels = expenses.map((expense, index) => {
      if (index === 0) return 0;
      return (new Date(expense.date).getTime() - 
              new Date(expenses[index - 1].date).getTime()) / (1000 * 60 * 60 * 24);
    }).filter(days => days > 0);
    
    const averageDaysBetweenRefuels = daysBetweenRefuels.reduce((a, b) => a + b, 0) / daysBetweenRefuels.length;

    // Calculate weekday vs weekend usage
    const weekdayVsWeekend = expenses.reduce((acc, expense) => {
      const day = new Date(expense.date).getDay();
      const isWeekend = day === 0 || day === 6;
      const miles = expense.mileage - (expenses[expenses.indexOf(expense) - 1]?.mileage || expense.mileage);
      
      if (isWeekend) {
        acc.weekend += miles;
      } else {
        acc.weekday += miles;
      }
      return acc;
    }, { weekday: 0, weekend: 0 });

    // Calculate refueling patterns
    const refuelingPatterns = expenses.reduce((acc, expense) => {
      const hour = new Date(expense.date).getHours();
      if (hour >= 5 && hour < 12) acc.morning++;
      else if (hour >= 12 && hour < 17) acc.afternoon++;
      else if (hour >= 17 && hour < 22) acc.evening++;
      else acc.night++;
      return acc;
    }, { morning: 0, afternoon: 0, evening: 0, night: 0 });

    return {
      averageDailyMileage,
      averageDaysBetweenRefuels,
      weekdayVsWeekend,
      refuelingPatterns
    };
  };

  const calculateCostOptimization = (expenses: any[]) => {
    if (!expenses.length) return null;

    // Group by gas station
    const gasStations = expenses.reduce((acc, expense) => {
      const station = expense.station || 'Unknown';
      if (!acc[station]) {
        acc[station] = {
          totalPrice: 0,
          visits: 0
        };
      }
      acc[station].totalPrice += expense.price_per_unit;
      acc[station].visits++;
      return acc;
    }, {});

    // Calculate best gas stations
    const bestGasStations = Object.entries(gasStations)
      .map(([name, data]: [string, any]) => ({
        name,
        averagePrice: data.totalPrice / data.visits,
        visits: data.visits
      }))
      .sort((a, b) => a.averagePrice - b.averagePrice)
      .slice(0, 3);

    // Calculate price trends by day
    const priceTrends = expenses.reduce((acc, expense) => {
      const day = new Date(expense.date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      acc[day] = (acc[day] || 0) + expense.price_per_unit;
      return acc;
    }, {});

    // Calculate cost per mile
    const totalCost = expenses.reduce((sum, expense) => sum + expense.total, 0);
    const totalMiles = expenses[expenses.length - 1].mileage - expenses[0].mileage;
    const costPerMile = totalCost / totalMiles;

    // Find optimal refueling time (cheapest average price)
    const optimalTime = Object.entries(priceTrends)
      .sort(([, a], [, b]) => a - b)[0][0];

    return {
      bestGasStations,
      priceTrends,
      costPerMile,
      optimalRefuelingTime: optimalTime
    };
  };

  const calculateEnvironmentalScore = (expenses: any[], vehicle: any) => {
    if (!expenses.length || !vehicle) return null;

    // Calculate eco-driving score based on MPG vs vehicle rating
    const actualMPG = calculateAverageMPG(expenses);
    const ratedMPG = vehicle.mpg || 0;
    const ecoDrivingScore = Math.min(100, (actualMPG / ratedMPG) * 100);

    // Calculate weather impact (simplified)
    const weatherImpact = {
      sunny: actualMPG,
      rainy: actualMPG * 0.9, // 10% reduction in rain
      cold: actualMPG * 0.85  // 15% reduction in cold
    };

    // Calculate potential savings
    const monthlySavings = (ratedMPG - actualMPG) * 
      (expenses.reduce((sum, e) => sum + e.gallons, 0) / expenses.length) * 
      expenses[expenses.length - 1].price_per_unit;

    return {
      ecoDrivingScore,
      weatherImpact,
      savingsPotential: {
        monthly: monthlySavings,
        yearly: monthlySavings * 12
      }
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#282828"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/menu')} style={styles.menuButton}>
            <Ionicons name="grid" size={24} color="#282828" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#282828" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Image
                source={{ uri: 'https://placekitten.com/100/100' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>Hello, {user?.user_metadata?.full_name || 'User'}!</Text>
          <Text style={styles.subtitle}>Your Vehicle Analytics</Text>

          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleTitle}>
              {analyticsData?.vehicleStats.make} {analyticsData?.vehicleStats.model}
            </Text>
            <Text style={styles.mileageText}>
              Current Mileage: {formatNumber(analyticsData?.vehicleStats.currentMileage)} miles
            </Text>
          </View>

          <View style={styles.statsCards}>
            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Monthly Gas Expenses</Text>
              <Text style={styles.cardValue}>{formatCurrency(analyticsData?.monthlyExpenses)}</Text>
              
              <View style={styles.comparisonContainer}>
                <Text style={styles.comparisonLabel}>vs Last Month</Text>
                <Text style={[
                  styles.comparisonValue,
                  (analyticsData?.monthlyComparison?.change ?? 0) >= 0 ? styles.positiveChange : styles.negativeChange
                ]}>
                  {formatPercentage((analyticsData?.monthlyComparison?.change ?? 0) / 100)}
                </Text>
              </View>

              <View style={styles.explanationContainer}>
                <Text style={styles.explanationText}>
                  {analyticsData?.monthlyComparison?.change >= 0 
                    ? `You're spending ${formatPercentage(analyticsData.monthlyComparison.change / 100)} more than last month.`
                    : `You've saved ${formatPercentage(Math.abs(analyticsData?.monthlyComparison?.change || 0) / 100)} compared to last month.`}
                </Text>
              </View>

              <View style={styles.chartContainer}>
                <LineChart
                  data={getChartData(analyticsData?.costTrends)}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForLabels: {
                      rotation: 90,
                      fontSize: 10,
                      textAnchor: 'end',
                      dx: -10,
                      dy: 0
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={[styles.statsCard, styles.greenCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Service Schedule</Text>
              <Text style={styles.serviceText}>{analyticsData?.nextService}</Text>
              <Text style={styles.serviceMileage}>
                Next service at {formatNumber(analyticsData?.serviceMileage)} miles
              </Text>

              <View style={styles.explanationContainer}>
                <Text style={styles.explanationText}>
                  Based on your driving patterns, you'll reach the service milestone in approximately {
                    Math.round((analyticsData?.serviceMileage - analyticsData?.vehicleStats.currentMileage) / 
                    (analyticsData?.drivingBehavior?.averageDailyMileage || 1))
                  } days.
                </Text>
              </View>

              <View style={styles.serviceHistory}>
                {analyticsData?.serviceHistory.slice(0, 3).map((record, index) => (
                  <View key={index} style={styles.serviceRecord}>
                    <Text style={styles.serviceDate}>{record.date}</Text>
                    <Text style={styles.serviceType}>{record.type}</Text>
                    <Text style={styles.serviceMileage}>{formatNumber(record.mileage)} miles</Text>
                  </View>
                ))}
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Performance Metrics</Text>
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Average MPG</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.avgMpg)}</Text>
                  <Text style={styles.metricSubtext}>
                    {analyticsData?.avgMpg && analyticsData?.vehicleStats.mpg 
                      ? analyticsData.avgMpg >= analyticsData.vehicleStats.mpg 
                        ? "Above rated MPG" 
                        : "Below rated MPG"
                      : ""}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Gallons</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.totalGallons)}</Text>
                  <Text style={styles.metricSubtext}>
                    {analyticsData?.totalGallons 
                      ? `Equivalent to ${Math.round(analyticsData.totalGallons * 3.78541)} liters`
                      : ""}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Yearly Cost</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.yearlyExpenses)}</Text>
                  <Text style={styles.metricSubtext}>
                    {analyticsData?.yearlyExpenses 
                      ? `About ${formatCurrency(analyticsData.yearlyExpenses / 12)} per month`
                      : ""}
                  </Text>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Fuel Efficiency Trends</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={getChartData(analyticsData?.fuelEfficiencyTrend)}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Best MPG</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.bestMpg)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Worst MPG</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.worstMpg)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Avg Price/Gal</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.averageFuelPrice)}</Text>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Cost Breakdown</Text>
              <View style={styles.chartContainer}>
                <BarChart
                  data={{
                    labels: analyticsData?.costBreakdown.map(item => item.category) || [],
                    datasets: [{
                      data: analyticsData?.costBreakdown.map(item => item.amount) || []
                    }]
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  style={styles.chart}
                />
              </View>
              <View style={styles.breakdownList}>
                {analyticsData?.costBreakdown.map((item, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <Text style={styles.breakdownCategory}>{item.category}</Text>
                    <View style={styles.breakdownBar}>
                      <View 
                        style={[
                          styles.breakdownBarFill,
                          { width: `${item.percentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Maintenance Predictions</Text>
              <View style={styles.predictionsList}>
                {analyticsData?.maintenancePredictions.map((prediction, index) => (
                  <View key={index} style={styles.predictionItem}>
                    <Text style={styles.predictionType}>{prediction.type}</Text>
                    <Text style={styles.predictionDate}>Due: {prediction.predictedDate}</Text>
                    <Text style={styles.predictionMileage}>
                      At {formatNumber(prediction.predictedMileage)} miles
                    </Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceBarFill,
                          { width: `${prediction.confidence * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.confidenceText}>
                      Confidence: {(prediction.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Environmental Impact</Text>
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CO2 Emissions</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.environmentalImpact.co2Emissions)} kg</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Trees Needed</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.environmentalImpact.treesNeeded)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Carbon Offset</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.environmentalImpact.carbonOffsetCost)}</Text>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Maintenance Costs</Text>
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Monthly</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.maintenanceCosts.monthly)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Yearly</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.maintenanceCosts.yearly)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.maintenanceCosts.total)}</Text>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Potential Savings</Text>
              <Text style={styles.cardValue}>{formatCurrency(analyticsData?.costSavings.potential)}</Text>
              <View style={styles.savingsRecommendations}>
                {analyticsData?.costSavings.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.savingsRecommendation}>
                    • {rec}
                  </Text>
                ))}
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Driving Behavior</Text>
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Daily Miles</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.drivingBehavior?.averageDailyMileage)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Days Between Refuels</Text>
                  <Text style={styles.metricValue}>{formatNumber(analyticsData?.drivingBehavior?.averageDaysBetweenRefuels)}</Text>
                </View>
              </View>
              
              <View style={styles.patternContainer}>
                <Text style={styles.patternTitle}>Weekday vs Weekend</Text>
                <View style={styles.patternBar}>
                  <View style={[styles.patternBarFill, { 
                    width: `${(analyticsData?.drivingBehavior?.weekdayVsWeekend.weekday / 
                    (analyticsData?.drivingBehavior?.weekdayVsWeekend.weekday + 
                     analyticsData?.drivingBehavior?.weekdayVsWeekend.weekend)) * 100}%` 
                  }]} />
                </View>
                <View style={styles.patternLabels}>
                  <Text style={styles.patternLabel}>Weekday</Text>
                  <Text style={styles.patternLabel}>Weekend</Text>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Cost Optimization</Text>
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Cost per Mile</Text>
                  <Text style={styles.metricValue}>{formatCurrency(analyticsData?.costOptimization?.costPerMile)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Best Day to Fill</Text>
                  <Text style={styles.metricValue}>{analyticsData?.costOptimization?.optimalRefuelingTime}</Text>
                </View>
              </View>
              
              <Text style={styles.subsectionTitle}>Top Gas Stations</Text>
              {analyticsData?.costOptimization?.bestGasStations.map((station, index) => (
                <View key={index} style={styles.stationItem}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <View style={styles.stationDetails}>
                    <Text style={styles.stationPrice}>{formatCurrency(station.averagePrice)}/gal</Text>
                    <Text style={styles.stationVisits}>{station.visits} visits</Text>
                  </View>
                </View>
              ))}
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.cardTitle}>Environmental Score</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{Math.round(analyticsData?.environmentalScore?.ecoDrivingScore || 0)}</Text>
                <Text style={styles.scoreLabel}>Eco Score</Text>
              </View>
              
              <View style={styles.weatherImpact}>
                <Text style={styles.weatherTitle}>MPG by Weather</Text>
                <View style={styles.weatherBars}>
                  <View style={styles.weatherBar}>
                    <Text style={styles.weatherLabel}>Sunny</Text>
                    <View style={styles.weatherBarFill}>
                      <View style={[styles.weatherBarValue, { 
                        width: `${(analyticsData?.environmentalScore?.weatherImpact.sunny / 
                        analyticsData?.environmentalScore?.weatherImpact.sunny) * 100}%` 
                      }]} />
                    </View>
                  </View>
                  <View style={styles.weatherBar}>
                    <Text style={styles.weatherLabel}>Rainy</Text>
                    <View style={styles.weatherBarFill}>
                      <View style={[styles.weatherBarValue, { 
                        width: `${(analyticsData?.environmentalScore?.weatherImpact.rainy / 
                        analyticsData?.environmentalScore?.weatherImpact.sunny) * 100}%` 
                      }]} />
                    </View>
                  </View>
                  <View style={styles.weatherBar}>
                    <Text style={styles.weatherLabel}>Cold</Text>
                    <View style={styles.weatherBarFill}>
                      <View style={[styles.weatherBarValue, { 
                        width: `${(analyticsData?.environmentalScore?.weatherImpact.cold / 
                        analyticsData?.environmentalScore?.weatherImpact.sunny) * 100}%` 
                      }]} />
                    </View>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  vehicleInfo: {
    marginBottom: 24,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 4,
  },
  mileageText: {
    fontSize: 14,
    color: '#666',
  },
  statsCards: {
    gap: 16,
    marginBottom: 60,
  },
  statsCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    overflow: 'hidden',
  },
  greenCard: {
    backgroundColor: 'rgba(230, 240, 230, 0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateText: {
    fontSize: 12,
    color: '#666',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 16,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#F44336',
  },
  serviceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 8,
  },
  serviceMileage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  serviceHistory: {
    marginBottom: 16,
  },
  serviceRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceDate: {
    fontSize: 12,
    color: '#666',
  },
  serviceType: {
    fontSize: 14,
    color: '#282828',
  },
  chartContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#282828',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownList: {
    marginTop: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownCategory: {
    width: 100,
    fontSize: 12,
    color: '#666',
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  breakdownAmount: {
    width: 80,
    fontSize: 12,
    color: '#282828',
    textAlign: 'right',
  },
  predictionsList: {
    marginTop: 16,
  },
  predictionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  predictionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 4,
  },
  predictionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  predictionMileage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  savingsRecommendations: {
    marginTop: 16,
  },
  savingsRecommendation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  patternContainer: {
    marginTop: 16,
  },
  patternTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  patternBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  patternBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  patternLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  patternLabel: {
    fontSize: 12,
    color: '#666',
  },
  
  subsectionTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stationName: {
    fontSize: 14,
    color: '#282828',
  },
  stationDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  stationPrice: {
    fontSize: 14,
    color: '#282828',
  },
  stationVisits: {
    fontSize: 14,
    color: '#666',
  },
  
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  
  weatherImpact: {
    marginTop: 16,
  },
  weatherTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  weatherBars: {
    gap: 8,
  },
  weatherBar: {
    gap: 4,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#666',
  },
  weatherBarFill: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  weatherBarValue: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  explanationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});