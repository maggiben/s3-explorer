// import Versions from './components/Versions';
// import electronLogo from './assets/electron.svg';
import Layout from './Layout';
import Providers from './Providers';
import NewBucket from './components/NewBucket';

function App({ settings }: { settings: Record<string, unknown> }): React.JSX.Element {
  return (
    <Providers settings={settings}>
      <Layout>
        <NewBucket />
      </Layout>
    </Providers>
  );
}

export default App;
