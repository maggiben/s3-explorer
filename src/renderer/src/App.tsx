import Layout from './Layout';
import Providers from './Providers';
import type { ISettings } from '../../types/ISettings';

function App({ settings }: { settings?: ISettings; ts?: number }): React.JSX.Element {
  return (
    <Providers settings={settings}>
      <Layout>
        <span>Hello</span>
      </Layout>
    </Providers>
  );
}

export default App;
