import PanelHeader from '../components/PanelHeader';

export default { title: 'Glass Card Primitives/PanelHeader' };

export const TitleOnly = () => <PanelHeader title="Market Overview" />;

export const WithSubtitle = () => (
  <PanelHeader title="Active Rounds" subtitle="Live prediction markets" />
);

export const WithActions = () => (
  <PanelHeader
    title="Leaderboard"
    subtitle="Top traders this week"
    actions={<button style={{ padding: '6px 12px', borderRadius: 8 }}>View All</button>}
  />
);

export const LongTitle = () => (
  <PanelHeader
    title="Recent Prediction History & Analytics"
    subtitle="Your last 30 days of activity"
  />
);
