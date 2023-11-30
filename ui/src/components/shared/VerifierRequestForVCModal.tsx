import { Modal, message } from "antd";
import { useState } from "react";
import { requestVC } from "src/adapters/api/requests";
import { ReactComponent as IconClose } from "src/assets/icons/x.svg";
import { useEnvContext } from "src/contexts/Env";
import { Credential } from "src/domain";
import { CLOSE, VERIFY_IDENTITY } from "src/utils/constants";

export function VerifierRequestVCModal({
  onClose,
  request,
}: {
  onClose: () => void;
  request: Credential;
}) {
  const env = useEnvContext();
  {
    /* eslint-disable */
  }
  const age = `${request.credentialSubject.Age}`;
  {
    /* eslint-disable */
  }
  const [messageAPI, messageContext] = message.useMessage();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleVerifierVCRequest = async () => {
    setIsLoading(true);

    const payload = {
      Age: age,
      ProofId: request.id,
      ProofType: "Adhar",
      RequestType: "VerifyVC",
      RoleType: "Individual",
      schemaID: "f880dc68-99c5-4f53-b974-7d0cef5ca4b7",
      Source: "Manual",
      userDID: request.userID,
    };

    await requestVC({ env, payload }).then((response) => {
      if (response.success) {
        void messageAPI.success(response.data.msg);
        onClose();
      } else {
        void messageAPI.error(response.error.message);
      }

      setIsLoading(false);
    });
  };

  return (
    <>
      {messageContext}

      <Modal
        cancelText={CLOSE}
        centered
        closable
        closeIcon={<IconClose />}
        maskClosable
        okButtonProps={{ danger: true, loading: isLoading }}
        okText={VERIFY_IDENTITY}
        onCancel={onClose}
        onOk={() => void handleVerifierVCRequest()}
        open
        title="Are you sure you want to verify this identity?"
      ></Modal>
    </>
  );
}
