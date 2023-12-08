import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import { useEffect, useState } from "react";
import { UploadDoc } from "../shared/Upload";
import {
  DigiLockerLogin,
  getDigiLockerDetails,
  getDigiLockerUrl,
  getUser,
  updateUser,
} from "src/adapters/api/user";
import { SiderLayoutContent } from "src/components/shared/SiderLayoutContent";

import { useEnvContext } from "src/contexts/Env";
import { useUserContext } from "src/contexts/UserDetails";
import {
  DigiLockerCreateUrlResponse,
  DigiLockerLoginResponse,
  FormValue,
  UserDetails,
} from "src/domain/user";
import { PROFILE, PROFILE_DETAILS, VALUE_REQUIRED } from "src/utils/constants";

export function Profile() {
  const { fullName, gmail, userDID, userType } = useUserContext();
  // const userDID = localStorage.getItem("userId");
  // console.log(userDID)
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [openVerificationModal, setOpenVerificationModal] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [userProfileData, setUserProfileData] = useState<UserDetails>();
  const env = useEnvContext();
  const src = "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png";
  const [messageAPI, messageContext] = message.useMessage();
  const [form] = Form.useForm();
  const ProfileStatus = localStorage.getItem("profile");
  const [response1, setResponse1] = useState<DigiLockerLoginResponse | null>(null);
  const [response2, setResponse2] = useState<DigiLockerCreateUrlResponse | null>(null);

  const [formValues, setFormValues] = useState<UserDetails>({
    address: userProfileData?.address || "",

    adhar: userProfileData?.adhar || "",
    // ddress: userProfileData?.address || "",
    dob: userProfileData?.dob || "",
    gstin: userProfileData?.gstin || "",
    owner: userProfileData?.owner || "",
    PAN: userProfileData?.PAN || "",
    phoneNumber: userProfileData?.phoneNumber || "",
    //DocumentationSource: userProfileData?.documentationSource || "",
    userType: userProfileData?.userType || "",
  });

  const handleCancel = () => {
    setOpenModal(false);
  };

  const handleNavigate = (url: string) => {
    window.open(url, "_blank");
  };

  const handleVerifyKYC = () => {
    try {
      void DigiLockerLogin({
        /* eslint-disable */
        username: `${import.meta.env.VITE_API_DIGI_LOCKER_USERNAME}`,
        password: `${import.meta.env.VITE_API_DIGI_LOCKER_PASSWORD}`,
        /* eslint-disable */
      }).then((response) => {
        if (response.success) {
          setResponse1(response.data);
          setOpenVerificationModal(true);
          void getDigiLockerUrl({
            userId: response.data.userId,
            id: response.data.id,
          }).then((newResponse) => {
            if (newResponse.success) {
              setResponse2(newResponse.data);
              setOpenVerificationModal(true);
              handleNavigate(newResponse.data.result.url);
            }
          });
        } else {
          void messageAPI.error("Wrong Credentials");
        }
      });
      //console.log(userDetails);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const handleClose = () => {
    setOpenVerificationModal(false);
  };

  const handleYesClick = () => {
    void getDigiLockerDetails({
      userId: response1?.userId || "",
      id: response1?.id || "",
      requestId: response2?.result.requestId || "",
    }).then((response) => {
      if (response.success) {
        console.log(response);
        setOpenVerificationModal(false);
      } else {
        window.alert("please complete the step first");
        void messageAPI.error(response.error.message);
      }
    });
  };

  // console.log(formValues);

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values: FormValue) => {
        const updatePayload = {
          Address: values.address,
          Adhar: values.Aadhar,
          DOB: values.dob,
          DocumentationSource: "manual",
          Gmail: "test@gmail.com",
          Gstin: values.gst,
          ID: userDID,
          Name: "test",
          Owner: values?.owner,
          PAN: values.PAN,
          PhoneNumber: values.mobile,
        };
        console.log("---", updatePayload);

        try {
          const userDetails = await updateUser({
            env,
            updatePayload,
          });

          if (userDetails.success) {
            localStorage.setItem("profile", "true");
            void messageAPI.success("Profile Updated");
            setOpenModal(false);
          } else {
            void messageAPI.error("Wrong Credentials");
          }
        } catch (error) {
          // Handle the error, e.g., show an error message
          console.error("An error occurred:", error);
        }
      })
      .catch((e) => {
        console.error("An error occurred:", e);
      });
  };

  const handleLogout = () => {
    //console.log("User logged out");
    setOpenVerificationModal(false);
  };

  useEffect(() => {
    if (ProfileStatus === "true") {
      const getUserDetails = async () => {
        const response = await getUser({
          env,
          userDID,
        });
        /* eslint-disable */
        setUserProfileData(response.data);
        /* eslint-enable */
        {
          /* eslint-disable */
        }
        setFormValues({
          dob: response.data.dob,
          Aadhar: response.data.adhar,
          PAN: response.data.PAN,
          owner: response.data.owner,
          gst: response.data.gstin,
          address: response.data.address,
          mobile: response.data.phoneNumber,
          DocumentationSource: response.data.documentationSource,
          Owner: response.data.owner,
        });
        {
          /* eslint-disable */
        }
      };
      getUserDetails().catch((e) => {
        console.error("An error occurred:", e);
      });
    }

    let timer: NodeJS.Timeout;
    if (openVerificationModal) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
        if (countdown === 0) {
          clearInterval(timer);
          setOpenVerificationModal(false);
        }
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [ProfileStatus, userDID, env, openVerificationModal, countdown]);

  // Calculate minutes and seconds
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  // Format the countdown as "mm:ss"
  const formattedCountdown = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;

  const columns = [
    {
      title: <strong>Document Type</strong>,
      dataIndex: "documentType",
      key: "documentType",
    },
    {
      title: <strong>Document Number</strong>,
      dataIndex: "documentNumber",
      key: "documentNumber",
    },
    {
      title: <strong>Status</strong>,
      dataIndex: "status",
      key: "status",
      render: (status: boolean) => (
        <Tag color={status ? "green" : "red"}>{status ? "Verified" : "Not Verified"}</Tag>
      ),
    },
  ];
  const data = [
    {
      key: "1",
      documentType: "Aadhar",
      documentNumber: userProfileData?.adhar || "-",
      status: userProfileData?.adharStatus,
    },
    {
      key: "2",
      documentType: "PAN",
      documentNumber: userProfileData?.PAN || "-",
      status: userProfileData?.PANStatus,
    },
    {
      key: "3",
      documentType: "GSTIN",
      documentNumber: userProfileData?.gstin || "-",
      status: userProfileData?.gstinStatus,
    },
  ];

  // Filter the 'data' array based on user type
  const filteredData = data.filter((item) => {
    return userProfileData?.userType === "Business" || item.documentType !== "GSTIN";
  });
  // const handleFormChange = (changedValues: any, allValues: FormValue) => {
  //  // console.log(allValues);
  //   setFormValues(allValues);
  // };
  return (
    <>
      {messageContext}
      <SiderLayoutContent title={PROFILE}>
        <Divider />
        <Space className="d-flex" direction="vertical">
          <Space>
            <Button onClick={() => setOpenModal(true)} type="primary">
              Update Manually
            </Button>
            <Button onClick={() => handleVerifyKYC()} type="primary">
              Update With Digilocker
            </Button>
          </Space>
          <Row gutter={50}>
            <Col span={12}>
              <div
                style={{
                  alignItems: "center",
                  backgroundColor: "white",
                  border: "1px solid #f0f0f0",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  height: 550,
                  justifyContent: "center",
                  textAlign: "center",
                  width: 480,
                }}
              >
                <Image src={src} style={{ borderRadius: 100, marginBottom: 10 }} width={200} />
                <Row>
                  <Typography.Text>{fullName}</Typography.Text>
                </Row>
                <Row>
                  <Typography.Text>{gmail}</Typography.Text>
                </Row>
                <Row>
                  <Typography.Text>{userProfileData?.phoneNumber}</Typography.Text>
                </Row>
              </div>
            </Col>
            <Col span={6}>
              <Card style={{ height: 550, width: 500, marginLeft: -28 }} title={PROFILE_DETAILS}>
                <Row>
                  <Typography.Text strong>UDID:</Typography.Text>
                  <Typography.Text>{userDID || userProfileData?.id}</Typography.Text>
                </Row>
                <Row>
                  <Typography.Text strong>Address</Typography.Text>
                  <Typography.Text>: {userProfileData?.address}</Typography.Text>
                </Row>
                <Row>
                  <Typography.Text strong>Adhaar Number</Typography.Text>
                  <Typography.Text style={{ marginRight: 10 }}>
                    : {userProfileData?.adhar}
                  </Typography.Text>
                  <UploadDoc />
                </Row>
                <Row>
                  <Typography.Text strong>PAN</Typography.Text>
                  <Typography.Text style={{ marginRight: 10 }}>
                    : {userProfileData?.PAN}
                  </Typography.Text>
                  <UploadDoc />
                </Row>
                <Row>
                  <Typography.Text strong>DOB</Typography.Text>
                  <Typography.Text>: {userProfileData?.dob}</Typography.Text>
                </Row>
                <Row style={{ marginTop: "10px" }}>
                  <Checkbox value="Individual" checked={userProfileData?.userType === "Individual"}>
                    <strong>Individual</strong>
                  </Checkbox>
                  <Checkbox value="Business" checked={userProfileData?.userType === "Business"}>
                    <strong>Business</strong>
                  </Checkbox>
                </Row>
                <Table
                  style={{
                    marginTop: 10,
                    paddingBottom: 10,
                    marginLeft: -15,
                    textAlign: "center",
                    width: 50,
                  }}
                  columns={columns}
                  dataSource={filteredData}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </SiderLayoutContent>
      <Modal onCancel={handleCancel} onOk={handleOk} open={openModal} title="Update Profile">
        <Form form={form} layout="vertical" initialValues={formValues}>
          <Form.Item
            label="DOB"
            name="dob"
            required
            rules={[{ message: VALUE_REQUIRED, required: true }]}
          >
            <Input placeholder="DOB" style={{ color: "#868686" }} disabled={!!userProfileData} />
          </Form.Item>
          <Form.Item
            label="Aadhar Number"
            name="Aadhar"
            required
            rules={[{ message: VALUE_REQUIRED, required: true }]}
          >
            <Input
              placeholder="Aadhar Number"
              style={{ color: "#868686" }}
              disabled={!!userProfileData}
            />
          </Form.Item>
          <Form.Item
            label="PAN"
            name="PAN"
            required
            rules={[{ message: VALUE_REQUIRED, required: true }]}
          >
            <Input placeholder="PAN" style={{ color: "#868686" }} disabled={!!userProfileData} />
          </Form.Item>
          <Form.Item
            label="User Type"
            name="request"
            required
            rules={[{ message: VALUE_REQUIRED, required: true }]}
          >
            <Input
              defaultValue={userType}
              placeholder="Request Type"
              style={{ color: "#868686" }}
            />
          </Form.Item>
          {userType !== "Individual" && (
            <Form.Item
              label="Owner"
              name="owner"
              required
              rules={[{ message: VALUE_REQUIRED, required: true }]}
            >
              <Input
                placeholder="Owner"
                style={{ color: "#868686" }}
                disabled={!!userProfileData}
              />
            </Form.Item>
          )}
          {userType !== "Individual" && (
            <Form.Item
              label="GSTIN"
              name="gst"
              required
              rules={[{ message: VALUE_REQUIRED, required: true }]}
            >
              <Input
                placeholder="GSTIN"
                style={{ color: "#868686" }}
                disabled={!!userProfileData}
              />
            </Form.Item>
          )}
          <Form.Item
            label="Address"
            name="address"
            required
            rules={[{ message: VALUE_REQUIRED, required: true }]}
          >
            <Input placeholder="Address" required style={{ color: "#868686" }} />
          </Form.Item>
          <Form.Item
            label="Mobile Number"
            name="mobile"
            required
            rules={[{ message: VALUE_REQUIRED, required: true }]}
          >
            <Input placeholder="Mobile Number" style={{ color: "#868686" }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        footer={[
          <Button key="yes" onClick={handleYesClick} type="primary">
            Yes
          </Button>,
          <Button key="logout" onClick={handleLogout}>
            Logout
          </Button>,
        ]}
        onCancel={handleClose}
        open={openVerificationModal}
        style={{
          textAlign: "center",
          top: 80,
        }}
        title="Digilocker Verification"
      >
        <p>Is Digilocker authentication done?</p>
        <Divider />
        <p>The Digilocker link will be expired in {formattedCountdown} minutes.</p>
        <Divider />
      </Modal>
    </>
  );
}
