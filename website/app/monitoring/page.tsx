import CustomModelDashboard from '@/components/monitoring/CustomModelDashboard';

export const metadata = {
  title: 'Custom Model Monitoring | BEAST MODE',
  description: 'Real-time monitoring and metrics for custom AI models'
};

export default function MonitoringPage() {
  return <CustomModelDashboard />;
}
