import React from "react";
import { Layout } from "antd";
import NeosConfig from "../../../neos.config.json";

const layoutConfig = NeosConfig.ui.layout;
const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  height: layoutConfig.header.height,
  paddingInline: 50,
  lineHeight: "64px",
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  minHeight: 120,
  height: layoutConfig.content.height,
  lineHeight: "120px",
};

const siderStyle: React.CSSProperties = {
  textAlign: "center",
  lineHeight: "120px",
  position: "fixed",
  overflow: "auto",
  height: "100vh",
  padding: "50px 20px",
  color: "#fff",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  height: layoutConfig.footer.height,
  color: "#fff",
};

const NeosLayout = (props: {
  sider: React.ReactNode;
  header: React.ReactNode;
  content: React.ReactNode;
  footer: React.ReactNode;
}) => {
  return (
    <Layout>
      <Sider style={siderStyle} width={layoutConfig.sider.width}>
        {props.sider}
      </Sider>
      <Layout>
        <Header style={headerStyle}>{props.header}</Header>
        <Content style={contentStyle}>{props.content}</Content>
        <Footer style={footerStyle}>{props.footer}</Footer>
      </Layout>
    </Layout>
  );
};

export default NeosLayout;
