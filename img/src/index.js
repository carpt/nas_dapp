import React from 'react';
import ReactDOM from 'react-dom';
import { LocaleProvider, message, Input, Button, Form, List, Tooltip, Alert } from 'antd';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Particles from 'particlesjs';
import 'moment/locale/zh-cn';
import './index.css';

moment.locale('zh-cn');
const FormItem = Form.Item;
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};
const formTailLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 8, offset: 4 },
};

const dappAddress = "n1pgoTfmkGieLYEX1CNmWvzH9SE7UZu4R8K";
const Account = nebulas.Account;
const neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io"));

Particles.init({
  selector: '.background',
  color: ['#1850ff', '#404569', '#DB3DF3'],
  connectParticles: true
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: false,
      showAdd: false,
      showWebExtensionWalletTip: false
    };
  }

  componentDidMount() {
    this.getList();
  }

  showError = (msg) => {
    msg && message.error(msg);
  }

  getList = () => {
    this.setState({
      loading: true
    });

    var from = Account.NewAccount().getAddressString();

    var value = "0";
    var nonce = "0";
    var gas_price = "1000000";
    var gas_limit = "2000000";
    var callFunction = "forEach";
    var callArgs = `["100", "0"]`; // in the form of ["args"]
    var contract = {
        "function": callFunction,
        "args": callArgs
    };

    neb.api.call(from, dappAddress, value, nonce, gas_price, gas_limit, contract).then((resp) => {
      this.setState({
        loading: false
      });

      var result = resp && resp.result;

      if (result && result != 'null') {
        try{
          result = JSON.parse(result)
        }catch (err){
          this.showError('数据解析失败');
        }

        // 有数据
        if (result && result[0]){
          this.setState({
            list: result
          });
        }
      }
    }).catch((err) => {
      this.setState({
        loading: false
      });
      this.showError(err.message);
    })
  }

  save = () => {
    const { form } = this.props;
    let hasError = false;
    form.validateFields((errors) => {
      if (errors) {
        hasError = true;
      }
    });

    if (hasError) {
      return;
    }

    const { name, link } = form.getFieldsValue();

    var nebPay = new NebPay();
    var serialNumber;
    var to = dappAddress;
    var value = '0';
    var callFunction = 'save';
    var callArgs = `["${name}","${link}"]`;

    serialNumber = nebPay.call(to, value, callFunction, callArgs, {
      listener: (resp) => {
        console.log("交易返回: " + JSON.stringify(resp))

        if (resp && resp.txhash) {
        } else {
          message.error('发布终止');
        }
      }
    });

    let intervalQuery = setInterval(() => {
      nebPay.queryPayInfo(serialNumber)   //search transaction result from server (result upload to server by app)
        .then((resp) => {
          console.log("交易结果: " + resp);
          var respObject = JSON.parse(resp);

          if(respObject.code === 0){
            message.success('发布成功！');
            this.getlist();
            clearInterval(intervalQuery);
          }
        })
        .catch((err) => {
          clearInterval(intervalQuery);
          message.success(err);
        });
    }, 5000);
  }

  switchShowAdd = () => {
    this.setState({
      showAdd: !this.state.showAdd,
      showWebExtensionWalletTip: typeof(webExtensionWallet) === "undefined"
    });
  }

  render() {
    const { list, loading, showAdd, showWebExtensionWalletTip } = this.state;
    const { getFieldDecorator } = this.props.form;

    return (
      <LocaleProvider locale={zhCN}>
        <div className="page-ads">
          <div className="hd">
            <img className="logo" src="./img/logo.png"/>
            <h1 className="page-title">基于星云链的浦田系医院黑榜，欢迎更新。</h1>
          </div>

          <div className="box-tip">
            <Tooltip placement="topRight" title="发布需要 gas 费用">
              <Button className="btn-show-add" type="primary" onClick={this.switchShowAdd}>{ showAdd ? '收起' : '我也要发布广告'}</Button>
            </Tooltip>
          </div>

          {
            showAdd && showWebExtensionWalletTip && <div>
              <Alert className="alert-wallet" message={<div>需要使用 Nas 支付 Gas，请安装<a href="https://github.com/ChengOrangeJu/WebExtensionWallet">钱包插件</a></div>} type="error" />
            </div>
          }

          {
            showAdd && !showWebExtensionWalletTip && <Form>
              <FormItem {...formItemLayout} label="医院名">
                {getFieldDecorator('name', {
                  rules: [{
                    required: true,
                    message: '请输入医院名',
                  }],
                })(
                  <Input placeholder="请输入医院名" />
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="网站链接">
                {getFieldDecorator('link', {
                  rules: [{
                    required: true,
                    message: '请输入链接',
                  }],
                })(
                  <Input placeholder="请输入链接" />
                )}
              </FormItem>
              <FormItem  {...formTailLayout}>
                <Button type="primary" onClick={this.save}>确认发布</Button>
              </FormItem>            
            </Form>
          }

          <List
            className="ad-list"
            loading={loading}
            bordered
            locale={{ emptyText: '暂无医院列表，欢迎添加' }}
            dataSource={list}
            renderItem={item => (<List.Item><a href={item.link}>{item.name}</a></List.Item>)}
          />
        </div>
      </LocaleProvider>
    );
  }
}

const WrappedDynamicApp = Form.create()(App);
ReactDOM.render(<WrappedDynamicApp />, document.getElementById('root'));