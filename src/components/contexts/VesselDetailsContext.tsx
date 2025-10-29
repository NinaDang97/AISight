import React from "react";

type VesselDetailsContextType = {
  cardVisible: boolean;
  setCardVisible: React.Dispatch<React.SetStateAction<boolean>>;
  detailsVisible: boolean;
  setDetailsVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const VesselDetailsContext = React.createContext<VesselDetailsContextType | undefined>(undefined);

export const useVesselDetails = (): VesselDetailsContextType => {
  const context = React.useContext(VesselDetailsContext);
  if(!context) throw new Error("Error with VesselDetailsContext");
  return context;
};

export const VesselDetailsProvider: React.FC<{children: React.ReactNode}> = ({children} : any) => {
  const [cardVisible, setCardVisible] = React.useState<boolean>(false);
  const [detailsVisible, setDetailsVisible] = React.useState<boolean>(false);
  return (
    <VesselDetailsContext.Provider
      value={{cardVisible,setCardVisible,detailsVisible,setDetailsVisible}} >
      {children}
    </VesselDetailsContext.Provider>
  );
};

