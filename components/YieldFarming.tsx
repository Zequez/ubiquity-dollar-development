import { memo, useEffect, useState } from "react";
import { connectedWithUserContext, useConnectedContext, UserContext } from "./context/connected";
import * as widget from "./ui/widget";
import { WarningIcon, HelpIcon } from "./ui/icons";
import { loadYieldProxyData, YieldProxyData, ensureERC20Allowance } from "./common/contractsShortcuts";
import { BigNumber, ethers } from "ethers";
import { performTransaction } from "./common/utils";

type Actions = {
  onDeposit: (payload: { usdc: string; ubq: string; uad: string }) => void;
};

export const YieldFarmingContainer = ({ contracts, account, signer }: UserContext) => {
  const [yieldProxyData, setYieldProxyData] = useState<YieldProxyData | null>(null);
  const { refreshBalances } = useConnectedContext();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async function () {
      setYieldProxyData(await loadYieldProxyData(contracts));
    })();
  }, []);

  const actions: Actions = {
    onDeposit: async ({ usdc, ubq, uad }) => {
      setIsProcessing(true);
      const bigUsdc = ethers.utils.parseUnits(usdc, 6);
      const bigUbq = ethers.utils.parseUnits(ubq, 18);
      const bigUad = ethers.utils.parseUnits(uad, 18);
      console.log(`Depositing: USDC ${usdc} | UBQ ${ubq} | uAD ${uad}`);
      if (
        (await ensureERC20Allowance("USDC", contracts.usdc, bigUsdc, signer, contracts.yieldProxy.address, 6)) &&
        (await ensureERC20Allowance("UBQ", contracts.ugov, bigUbq, signer, contracts.yieldProxy.address)) &&
        (await ensureERC20Allowance("uAD", contracts.uad, bigUad, signer, contracts.yieldProxy.address)) &&
        (await performTransaction(contracts.yieldProxy.connect(signer).deposit(bigUsdc, bigUad, bigUbq)))
      ) {
        refreshBalances();
      } else {
        // TODO: Show transaction error
      }
      setIsProcessing(false);
    },
  };

  return <YieldFarming onDeposit={actions.onDeposit} usdcApy={{ min: 0.1418, max: 0.2707 }} yieldProxyData={yieldProxyData} />;
};

type YieldFarmingProps = {
  usdcApy: { min: number; max: number };
  yieldProxyData: YieldProxyData | null;
  onDeposit: Actions["onDeposit"];
};

export const YieldFarming = memo(({ usdcApy, yieldProxyData, onDeposit }: YieldFarmingProps) => {
  function onClickDeposit() {
    onDeposit({ usdc: "100", ubq: "500", uad: "40" }); // TODO: Use real values from the UI
  }

  return (
    <widget.Container className="max-w-screen-md !mx-auto relative">
      <widget.Title text="Boosted yield farming" />
      <div className="flex justify-evenly items-center p-4 border border-white/10 border-solid bg-accent bg-opacity-10 rounded-md mb-4">
        <div className="w-20">{WarningIcon}</div>
        <p className="text-left flex-grow">
          uAR is 1:1 redeemable for uAD when our TWAP goes above 1.00.{" "}
          <a target="_blank" href="https://medium.com/ubiquity-dao/ubiquitys-debt-system-explained-40e51325fc5">
            Learn more &raquo;
          </a>
        </p>
      </div>
      <widget.SubTitle text="Deposit" />
      <div className="flex justify-between items-center mb-8">
        <div className="w-5/12">
          <div className="flex justify-between">
            <span className="font-bold">USDC</span>
            <span>
              <span>TVL</span>
              <span className="pl-4">1.2M</span>
            </span>
          </div>
          <div className="text-left mb-2">
            <span>14.18% - 27.07%</span>
            <span className="pl-2">APY</span>
            <span className="pl-2">{HelpIcon}</span>
          </div>
          <input type="text" placeholder="2,000" className="w-full m-0 box-border" />
        </div>
        <div className="w-1/2">
          <div className="text-3xl text-accent font-bold">40.59%</div>
          <div>
            Max APY in uAR<span className="pl-2">{HelpIcon}</span>
          </div>
        </div>
      </div>
      <widget.SubTitle text="Boosters" />
      <div className="flex justify-between items-center mb-4">
        <div className="w-5/12">
          <div className="flex justify-between">
            <span className="font-bold">UBQ</span>
            <span>
              <span>TVL</span>
              <span className="pl-4">2.5M</span>
            </span>
          </div>
          <div className="text-left w-10/12 mb-2">
            <span>Minimizes deposit fee</span>
            <span className="pl-2" title="The deposit fee gets converted to uAR when you withdraw">
              {HelpIcon}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <input type="text" placeholder="Max 10,000" className="w-10/12 m-0 box-border" />
            <div className="flex flex-col text-center justify-center items-center text-accent">
              <span>10%</span>
              <span className="text-xs">FEE</span>
            </div>
          </div>
          <div className="w-10/12 flex justify-end mt-2">
            <span className="text-accent cursor-pointer">Max</span>
          </div>
        </div>
        <div className="w-5/12">
          <div className="flex justify-between">
            <span className="font-bold">uAD</span>
            <span className="pl-4">
              <span>TVL</span>
              <span className="pl-4">0.6M</span>
            </span>
          </div>
          <div className="text-left  w-10/12 mb-2">
            <span>Multiples yield up to 50%</span>
            <span className="pl-2">{HelpIcon}</span>
          </div>
          <div className="flex justify-between items-center">
            <input type="text" placeholder="Max 50% of deposit" className="w-10/12 m-0 box-border" />
            <div className="flex flex-col text-center justify-center items-center text-accent">
              <span>0%</span>
              <span className="text-xs">BOOST</span>
            </div>
          </div>
          <div className="w-10/12 flex justify-end mt-2">
            <span className="text-accent cursor-pointer">Max</span>
          </div>
        </div>
      </div>
      <button onClick={onClickDeposit} className="w-full flex justify-center m-0 mt-8">
        Deposit
      </button>
    </widget.Container>
  );
});

export default connectedWithUserContext(YieldFarmingContainer);