import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  CircularTransitionProvider,
  TransitionLink,
  useCircularTransition,
} from 'circular-page-transition/react';

function App() {
  const engine = useCircularTransition();
  const [page, setPage] = React.useState('home');

  return (
    <>
      <nav>
        <TransitionLink to="/?page=home" onNavigate={() => setPage('home')}>HOME</TransitionLink>
        <TransitionLink to="/?page=work" onNavigate={() => setPage('work')}>WORK</TransitionLink>
        <TransitionLink to="/?page=about" onNavigate={() => setPage('about')}>ABOUT</TransitionLink>
      </nav>
      <main>
        <h1>{page.toUpperCase()}</h1>
        <p>Core engine instance: {engine ? 'ready' : 'not ready'}.</p>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <CircularTransitionProvider options={{ duration: 1180, labelScale: 1.8 }}>
    <App />
  </CircularTransitionProvider>,
);
