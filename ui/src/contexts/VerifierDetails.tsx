import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { Verifier, VerifierContext } from "src/domain/VerifierContext";

// Create a context for the API response details
// eslint-disable-next-line import/no-default-export
export const VerifierDetailsContext = createContext<VerifierContext>({
  OrganizationName: "",
  OrgEmail: "",
  OrgPassword: "",
  OrgUsername: "",
  // eslint-disable-next-line
  setVerifierDetails: () => {},
});

export function VerifierDetailsProvider(props: PropsWithChildren) {
  /* eslint-disable */

  const [VerifierDetails, setVerifierDetailsState] = useState<Verifier>(() => {
    // Initialize state from localStorage if available
    const storedDetails = localStorage.getItem("VerifierDetails");
    return storedDetails
      ? JSON.parse(storedDetails)
      : {
          OrgEmail: "",
          OrganizationName: "",
          OrgPassword: "",
          OrgUsername: "",
        };
  });

  /* eslint-enable */

  const setVerifierDetails = (details: Verifier) => {
    setVerifierDetailsState(details);
    // Store the details in localStorage
    localStorage.setItem("VerifierDetails", JSON.stringify(details));
  };

  useEffect(() => {
    // Add event listener to clear the storage on logout or other conditions
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "VerifierDetails" && e.newValue === null) {
        setVerifierDetailsState({
          OrganizationName: "",
          OrgEmail: "",
          OrgPassword: "",
          OrgUsername: "",
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const contextValue = {
    OrganizationName: VerifierDetails.OrganizationName,
    OrgEmail: VerifierDetails.OrgEmail,
    OrgPassword: VerifierDetails.OrgPassword,
    OrgUsername: VerifierDetails.OrgUsername,
    setVerifierDetails: (
      OrgEmail: string,
      OrganizationName: string,
      OrgUsername: string,
      OrgPassword: string
    ): void => {
      setVerifierDetails({
        OrganizationName,
        OrgEmail,
        OrgPassword,
        OrgUsername,
      });
    },
  };

  return <VerifierDetailsContext.Provider value={contextValue} {...props} />;
}

export function useVerifierContext(): VerifierContext {
  return useContext(VerifierDetailsContext);
}
