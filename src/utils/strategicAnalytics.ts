import { MasterSalesRecord, ClientProfile, Quotation } from '../types';

export interface ParetoItem {
  clientName: string;
  revenue: number;
  cumulativeRevenue: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
  isTop80: boolean;
}

export interface StrategicMetrics {
  totalCompanyDpp: number;
  myPortfolioDpp: number;
  portfolioSharePercent: number;
  totalTransactions: number;
  myPortfolioTransactions: number;
  averageOrderValue: number;
  monthlyTarget: number;
  portfolioTarget: number;
  achievementPercent: number;
  yearlyTarget: number;
  yearlyAchievementPercent: number;
  runRateForecastDpp: number;
  topParetoClientsCount: number;
  topParetoRevenue: number;
  atRiskClientsCount: number;
  dormantClientsCount: number;
  totalIncentiveEstimated: number;
  paidIncentive: number;
  pendingIncentive: number;
  midMonthDpp: number; // 1-15 Aug
  endMonthDpp: number; // 16-31 Aug
  // Quotation metrics
  totalQuotations: number;
  wonQuotations: number;
  lostQuotations: number;
  negotiationQuotations: number;
  winRatePercent: number;
  totalQuotationPipelineDpp: number;
  wonQuotationDpp: number;
}

export function computeStrategicMetrics(
  records: MasterSalesRecord[],
  clients: ClientProfile[],
  portfolioTarget = 120000000,
  yearlyTarget = 1440000000,
  quotations: Quotation[] = []
): StrategicMetrics {
  let totalCompanyDpp = 0;
  let myPortfolioDpp = 0;
  let myPortfolioTransactions = 0;
  let totalIncentiveEstimated = 0;
  let paidIncentive = 0;
  let pendingIncentive = 0;
  let midMonthDpp = 0;
  let endMonthDpp = 0;

  records.forEach(r => {
    const dpp = r.dppTotal || 0;
    totalCompanyDpp += dpp;

    const day = parseInt(r.dateParsed.split('-')[2] || '1', 10);
    if (day <= 15) {
      midMonthDpp += dpp;
    } else {
      endMonthDpp += dpp;
    }

    if (r.isMyAuthority) {
      myPortfolioDpp += dpp;
      myPortfolioTransactions++;
      
      const inc = r.incentiveAmount || 0;
      totalIncentiveEstimated += inc;
      if (r.paymentStatus === 'Lunas') {
        paidIncentive += inc;
      } else {
        pendingIncentive += inc;
      }
    }
  });

  const portfolioSharePercent = totalCompanyDpp > 0 ? (myPortfolioDpp / totalCompanyDpp) * 100 : 0;
  const averageOrderValue = myPortfolioTransactions > 0 ? Math.round(myPortfolioDpp / myPortfolioTransactions) : 0;
  const achievementPercent = portfolioTarget > 0 ? (myPortfolioDpp / portfolioTarget) * 100 : 0;
  const yearlyAchievementPercent = yearlyTarget > 0 ? (myPortfolioDpp / (yearlyTarget / 12)) * 100 : 0;

  // Assuming full month data (August has 22 working days, all complete)
  const runRateForecastDpp = myPortfolioDpp;

  // Pareto computation for user's portfolio
  const portfolioClients = clients.filter(c => c.portfolioDppSpend > 0);
  const sortedClients = [...portfolioClients].sort((a, b) => b.portfolioDppSpend - a.portfolioDppSpend);
  let runningSum = 0;
  let topParetoClientsCount = 0;
  let topParetoRevenue = 0;

  sortedClients.forEach(c => {
    runningSum += c.portfolioDppSpend;
    if (myPortfolioDpp > 0 && (runningSum / myPortfolioDpp) <= 0.82) {
      topParetoClientsCount++;
      topParetoRevenue += c.portfolioDppSpend;
    }
  });
  if (topParetoClientsCount === 0 && sortedClients.length > 0) {
    topParetoClientsCount = 1;
    topParetoRevenue = sortedClients[0]?.portfolioDppSpend || 0;
  }

  const atRiskClientsCount = clients.filter(c => c.status === 'At Risk').length;
  const dormantClientsCount = clients.filter(c => c.status === 'Dormant').length;

  // Quotation metrics calculation
  const totalQuotations = quotations.length;
  const wonQuotations = quotations.filter(q => q.status === 'Won').length;
  const lostQuotations = quotations.filter(q => q.status === 'Lost').length;
  const negotiationQuotations = quotations.filter(q => q.status === 'Negosiasi' || q.status === 'Follow Up').length;
  
  // Win rate = Won / (Won + Lost) or Won / Total if no lost yet
  const decisiveDeals = wonQuotations + lostQuotations;
  const winRatePercent = decisiveDeals > 0 
    ? Math.round((wonQuotations / decisiveDeals) * 100) 
    : (totalQuotations > 0 ? Math.round((wonQuotations / totalQuotations) * 100) : 0);

  const totalQuotationPipelineDpp = quotations.reduce((acc, q) => acc + (q.dppTotal || 0), 0);
  const wonQuotationDpp = quotations
    .filter(q => q.status === 'Won')
    .reduce((acc, q) => acc + (q.dppTotal || 0), 0);

  return {
    totalCompanyDpp,
    myPortfolioDpp,
    portfolioSharePercent,
    totalTransactions: records.length,
    myPortfolioTransactions,
    averageOrderValue,
    monthlyTarget: 350000000,
    portfolioTarget,
    achievementPercent,
    yearlyTarget,
    yearlyAchievementPercent,
    runRateForecastDpp,
    topParetoClientsCount,
    topParetoRevenue,
    atRiskClientsCount,
    dormantClientsCount,
    totalIncentiveEstimated,
    paidIncentive,
    pendingIncentive,
    midMonthDpp,
    endMonthDpp,
    totalQuotations,
    wonQuotations,
    lostQuotations,
    negotiationQuotations,
    winRatePercent,
    totalQuotationPipelineDpp,
    wonQuotationDpp,
  };
}

export function computeParetoData(clients: ClientProfile[], onlyMyPortfolio = true): ParetoItem[] {
  const eligible = onlyMyPortfolio
    ? clients.filter(c => c.portfolioDppSpend > 0)
    : clients.filter(c => c.totalDppSpend > 0);

  const sorted = [...eligible].sort((a, b) => {
    const revA = onlyMyPortfolio ? a.portfolioDppSpend : a.totalDppSpend;
    const revB = onlyMyPortfolio ? b.portfolioDppSpend : b.totalDppSpend;
    return revB - revA;
  });

  const totalRev = sorted.reduce((sum, c) => sum + (onlyMyPortfolio ? c.portfolioDppSpend : c.totalDppSpend), 0);
  let running = 0;

  return sorted.slice(0, 15).map(c => {
    const rev = onlyMyPortfolio ? c.portfolioDppSpend : c.totalDppSpend;
    running += rev;
    const pct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
    const cumPct = totalRev > 0 ? (running / totalRev) * 100 : 0;

    return {
      clientName: c.companyName,
      revenue: rev,
      cumulativeRevenue: running,
      percentageOfTotal: Math.round(pct * 10) / 10,
      cumulativePercentage: Math.round(cumPct * 10) / 10,
      isTop80: cumPct <= 82,
    };
  });
}
