import { useState, useEffect } from "react";
import Web3 from "web3";
import Header from "./components/Header";
import Title from "./components/Title";
import CurrentBalance from "./components/CurrentBalance";
import ErrorMessage from "./components/ErrorMessage";
import TxList from "./components/TxList";
import Inputs from "./components/Inputs";
import ActionBtn from "./components/ActionBtn";
import startPayment from "./utils/startPayment";
import { NO_ETH_BROWSER_WALLET, FAILED_TO_CONNECT } from "./constants/error";
import "./App.css";

const storagedTxs: Transaction[] = JSON.parse(localStorage.getItem('txs') || '[]');

export default function App() {
  const [error, setError] = useState('');
  const [txs, setTxs] = useState<Transaction[]>(storagedTxs);
  const [siteConnected, setSiteConnected] = useState(false);
  const [balance, setBalance] = useState("");

  const handleNewTx = (tx: Transaction) => {
    const updatedTxs: Transaction[] = [...txs, tx];
    setTxs(updatedTxs);
    localStorage.setItem('txs', JSON.stringify(updatedTxs))
    setBalance(
      // @ts-ignore
      (Number(balance) - tx.gasPrice - tx.value).toString()
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const data = new FormData(e.target);
    if (error) setError('');
    await startPayment({
      setError,
      handleNewTx,
      ether: data.get("ether")?.toString() || '',
      addr: data.get("addr")?.toString() || '',
    });
  };

  const handleInitialConnection = async (account: string) => {
    setSiteConnected(true);
    window.web3 = new Web3(window.ethereum);
    const balance = await window.web3.eth.getBalance(account);
    const formattedBalance = await window.web3.utils.fromWei(balance);
    if (formattedBalance) setBalance(formattedBalance.toString());
  };

  useEffect(() => {
    const isBrowserWalletConnected = async () => {
      if (!window.ethereum) throw new Error(NO_ETH_BROWSER_WALLET);

      window.web3 = new Web3(window.ethereum);
      const accounts = await window.web3.eth.getAccounts();
      if (accounts?.length > 0) {
        const account = accounts[0];
        await handleInitialConnection(account);
      }
    };
    try {
      isBrowserWalletConnected();
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  async function handleBtnConnectSiteClick() {
    try {
      if (!window.ethereum) throw new Error(NO_ETH_BROWSER_WALLET);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      if (account) {
        await handleInitialConnection(account);
      } else {
        throw new Error(FAILED_TO_CONNECT);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <Header />
      <form className="m-4" onSubmit={handleSubmit}>
        <main className="w-full lg:w-1/2 sm:w-auto shadow-lg mx-auto rounded-xl bg-white">
          <div className="mt-4 p-4">
            <Title />
            <CurrentBalance balance={balance} />
            <Inputs siteConnected={siteConnected} />
          </div>
          <div className="p-4">
            <ActionBtn
              siteConnected={siteConnected}
              handleBtnConnectSiteClick={handleBtnConnectSiteClick}
            />
            <ErrorMessage message={error} />
            {siteConnected && <TxList txs={txs} />}
          </div>
        </main>
      </form>
    </>
  );
}

type Transaction = {
  gasPrice: string;
  value: string;
  hash: string;
}