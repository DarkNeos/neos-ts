import React from "react";
import { Layout } from "antd";

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  height: 64,
  paddingInline: 50,
  lineHeight: "64px",
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  minHeight: 120,
  lineHeight: "120px",
};

const siderStyle: React.CSSProperties = {
  textAlign: "center",
  lineHeight: "120px",
  color: "#fff",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
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
      <Sider style={siderStyle}>{props.sider}</Sider>
      <Layout>
        <Header style={headerStyle}>{props.header}</Header>
        <Content style={contentStyle}>{props.content}</Content>
        <Footer style={footerStyle}>{props.footer}</Footer>
      </Layout>
    </Layout>
  );
};

export default NeosLayout;
