import { useContext } from 'react';
import { AppContext, AppContextValue } from './AppContext';

/**
 * Custom hook to access the App Context
 * Throws an error if used outside of AppProvider
 */
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};
