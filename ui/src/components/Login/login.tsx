import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Space, message } from "antd";
import { useState } from "react";
import { Link, generatePath, useNavigate } from "react-router-dom";
import { login, verifierLogin } from "src/adapters/api/user";
import { useEnvContext } from "src/contexts/Env";
import { useUserContext } from "src/contexts/UserDetails";
import { useVerifierContext } from "src/contexts/VerifierDetails";
import { LoginLabel } from "src/domain";
import { ROUTES } from "src/routes";

export const Login = () => {
  const navigate = useNavigate();
  const { setUserDetails } = useUserContext();
  const { setVerifierDetails } = useVerifierContext();
  const [messageAPI, messageContext] = message.useMessage();
  const env = useEnvContext();
  const [loginType, setLoginType] = useState<string>("user");
  //console.log(loginType);
  const onFinish = async (values: LoginLabel) => {
    console.log("Received values of form: ", values);
    if (values.username !== "issuer" && loginType === "user") {
      console.log("user");
      try {
        //console.log(env);
        const userDetails = await login({
          env,
          password: values.password,
          username: values.username,
        });

        if (userDetails.success) {
          localStorage.setItem("user", values.username);
          localStorage.setItem("profile", userDetails.data.iscompleted.toString());
          localStorage.setItem("userId", userDetails.data.userDID);
          navigate(generatePath(ROUTES.profile.path));
          setUserDetails(
            userDetails.data.username,
            userDetails.data.password,
            userDetails.data.userDID,
            userDetails.data.fullName,
            userDetails.data.gmail,
            userDetails.data.userType
          );
        } else {
          void messageAPI.error("Wrong Credentials");
        }
      } catch (error) {
        // Handle the error, e.g., show an error message
        console.error("An error occurred:", error);
      }
    } else if (loginType === "verifier") {
      console.log("verifier");
      // localStorage.setItem("profile", "true");
      // localStorage.setItem("user", values.username);
      // navigate(generatePath(ROUTES.request.path));
      // localStorage.removeItem("user");
      // localStorage.removeItem("profile");
      // localStorage.removeItem("userId");
      try {
        //console.log(env);
        const verifierDetails = await verifierLogin({
          env,
          OrgPassword: values.password,
          OrgUsername: values.username,
        });

        if (verifierDetails.success) {
          localStorage.setItem("profile", "true");
          localStorage.setItem("OrganizationName", verifierDetails.data.orgName);
          localStorage.setItem("user", "verifier");
          localStorage.setItem("name", verifierDetails.data.orgUsername);
          navigate(generatePath(ROUTES.request.path));
          setVerifierDetails(
            verifierDetails.data.orgName,
            verifierDetails.data.orgUsername,
            verifierDetails.data.orgEmail,
            verifierDetails.data.id
          );
        } else {
          void messageAPI.error("Wrong Credentials");
        }
      } catch (error) {
        // Handle the error, e.g., show an error message
        console.error("An error occurred:", error);
      }
    }
    if (loginType === "issuer") {
      console.log("issuer");
      localStorage.setItem("profile", "true");
      localStorage.setItem("user", values.username);
      navigate(generatePath(ROUTES.request.path));
    }
  };

  return (
    <>
      {messageContext}
      {/* Toggle button for selecting login type */}
      <Form.Item>
        <Button.Group>
          <Button
            onClick={() => setLoginType("user")}
            type={loginType === "user" ? "primary" : "default"}
          >
            User
          </Button>
          <Button
            onClick={() => setLoginType("verifier")}
            type={loginType === "verifier" ? "primary" : "default"}
          >
            Verifier
          </Button>
          <Button
            onClick={() => setLoginType("issuer")}
            type={loginType === "issuer" ? "primary" : "default"}
          >
            Issuer
          </Button>
        </Button.Group>
      </Form.Item>
      <Form
        className="login-form"
        initialValues={{
          remember: true,
        }}
        name="normal_login"
        // eslint-disable-next-line
        onFinish={onFinish}
      >
        <Form.Item
          name="username"
          rules={[
            {
              message: "Please input your Username!",
              required: true,
            },
          ]}
        >
          <Input placeholder="Username" prefix={<UserOutlined className="site-form-item-icon" />} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            {
              message: "Please input your Password!",
              required: true,
            },
          ]}
        >
          <Input
            placeholder="Password"
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
          />
        </Form.Item>
        <Form.Item>
          <Form.Item name="remember" noStyle valuePropName="checked">
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <a className="login-form-forgot" href="">
            Forgot password
          </a>
        </Form.Item>

        <Form.Item>
          <Space
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button className="login-form-button" htmlType="submit" type="primary">
              Log in
            </Button>
            {loginType != "issuer" && (
              <>
                Or{" "}
                <Link to={generatePath(ROUTES.register.path, { typeOfUser: loginType })}>
                  Register
                </Link>
              </>
            )}
          </Space>
        </Form.Item>
      </Form>
      {/* {openProfileModal && <ProfileUpdateModal />} */}
      {/* onClose={() => setOpenModal(undefined)} */}
    </>
  );
};
