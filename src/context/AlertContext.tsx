import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import GlassAlert, { AlertType } from '../components/GlassAlert';

interface AlertConfig {
  title: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  onConfirm?: () => void;
  buttons?: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
}

interface AlertContextData {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((newConfig: AlertConfig) => {
    setConfig(newConfig);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <GlassAlert
        visible={visible}
        title={config.title}
        message={config.message}
        type={config.type}
        confirmText={config.confirmText}
        onConfirm={config.onConfirm}
        buttons={config.buttons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};
