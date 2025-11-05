/**
 * VesselDetailsContext
 *
 * React Context for managing vessel details popup state across the application.
 * This context provides shared state management for the vessel details bottom sheet,
 * allowing the Map component to trigger the popup and VesselDetailsScreen to render it.
 *
 * @module VesselDetailsContext
 *
 * State managed:
 * - cardVisible: Controls visibility of the vessel details popup
 * - detailsVisible: Controls visibility of expanded AIS details section
 * - vesselData: Stores the selected vessel's GeoJSON feature data
 *
 * Usage:
 * 1. Wrap components with VesselDetailsProvider
 * 2. Use useVesselDetails() hook to access state and setters
 *
 * @example
 * ```tsx
 * // In parent component (e.g., MapScreen)
 * <VesselDetailsProvider>
 *   <Map />
 *   <VesselDetailsScreen />
 * </VesselDetailsProvider>
 *
 * // In child component (e.g., Map)
 * const { setVesselData, setCardVisible } = useVesselDetails();
 * // When vessel is tapped:
 * setVesselData(vesselFeature);
 * setCardVisible(true);
 * ```
 */

import React from "react";

/**
 * Type definition for the Vessel Details Context value
 *
 * @property {boolean} cardVisible - Controls visibility of the entire vessel popup card
 * @property {Function} setCardVisible - Setter for cardVisible state
 * @property {boolean} detailsVisible - Controls visibility of expanded details section within the card
 * @property {Function} setDetailsVisible - Setter for detailsVisible state
 * @property {any} vesselData - GeoJSON Feature object containing vessel properties and coordinates
 * @property {Function} setVesselData - Setter for vesselData state
 */
type VesselDetailsContextType = {
  cardVisible: boolean;
  setCardVisible: React.Dispatch<React.SetStateAction<boolean>>;
  detailsVisible: boolean;
  setDetailsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  vesselData: any; // TODO: Type as GeoJSON.Feature with vessel properties
  setVesselData: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * React Context instance for vessel details state
 * Initialized with undefined to enforce provider usage
 */
const VesselDetailsContext = React.createContext<VesselDetailsContextType | undefined>(undefined);

/**
 * Custom hook to access VesselDetailsContext
 *
 * This hook provides type-safe access to the vessel details context.
 * It must be used within a VesselDetailsProvider, otherwise it will throw an error.
 *
 * @throws {Error} If used outside of VesselDetailsProvider
 * @returns {VesselDetailsContextType} The context value containing state and setters
 *
 * @example
 * ```tsx
 * const { cardVisible, setCardVisible, vesselData, setVesselData } = useVesselDetails();
 *
 * // Show vessel popup
 * setVesselData(selectedVesselFeature);
 * setCardVisible(true);
 *
 * // Hide vessel popup
 * setCardVisible(false);
 * ```
 */
export const useVesselDetails = (): VesselDetailsContextType => {
  const context = React.useContext(VesselDetailsContext);
  if (!context) {
    throw new Error("useVesselDetails must be used within a VesselDetailsProvider");
  }
  return context;
};

/**
 * VesselDetailsProvider Component
 *
 * Context provider that manages vessel details popup state.
 * Wraps components that need access to vessel details state.
 *
 * State initialized:
 * - cardVisible: false (popup hidden by default)
 * - detailsVisible: false (expanded details hidden by default)
 * - vesselData: null (no vessel selected by default)
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the context
 *
 * @example
 * ```tsx
 * <VesselDetailsProvider>
 *   <Map />
 *   <VesselDetailsScreen />
 * </VesselDetailsProvider>
 * ```
 */
export const VesselDetailsProvider: React.FC<{ children: React.ReactNode }> = ({ children }: any) => {
  // State: Controls visibility of the vessel details popup card
  const [cardVisible, setCardVisible] = React.useState<boolean>(false);

  // State: Controls visibility of expanded details section within the card
  const [detailsVisible, setDetailsVisible] = React.useState<boolean>(false);

  // State: Stores the selected vessel's GeoJSON feature data
  const [vesselData, setVesselData] = React.useState<any>(null);

  return (
    <VesselDetailsContext.Provider
      value={{
        cardVisible,
        setCardVisible,
        detailsVisible,
        setDetailsVisible,
        vesselData,
        setVesselData
      }}
    >
      {children}
    </VesselDetailsContext.Provider>
  );
};

