import React, { useEffect, useState } from "react";
import Head from 'next/head';
import { enableMasca, isError } from '@blockchain-lab-um/masca-connector';
import Progress from '../components/Progress';
import InfoLinks from "@/components/InfoLinks";
import CamerasView from "@/components/CamerasView";
import WarrningMessage from "@/components/WarrningMessage";
import TitlePurpose from "@/components/TitlePurpose";

function index() {
    const query = `$[?(@.data.credentialSubject.type == "${process.env.NEXT_PUBLIC_VC_FILTER_TYPE}")]`;
    const metaMaskErrorMessage = "Your MetaMask/Masca does not load. Make sure your MetaMask is set up and connected to your Masca.";
    const backendErrorMessage = "Our media server is currently unavailable or does not accept new request for performance reasons. We are sorry for the inconvenience.";
    const noVPErrorMessage = "No matching verifiable credentials were shared by your wallet."

    const [backendHealthy, setBackendHealthy] = useState(false);
    const [walletLoaded, setWalletLoaded] = useState(false);
    const [metaMaskFailed, setMetaMaskFailed] = useState(false);
    const [vp, setVP] = useState(null);

    const healthCheck = () => {
        console.log(`Probing the backend server: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);

        const probe = async () => {
            let response: Response | null = null;

            try {
                response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL, {
                    method: 'OPTIONS'
                });
            } catch (error) {
                console.error(`Exception in backend health check: ${error}`)
                setBackendHealthy(false);
            }

            if (response !== null && response.ok) {
                setBackendHealthy(true);
                console.log("Backend health check passed.")
            } else {
                setBackendHealthy(false);
            }
        };

        probe()
    };

    async function assureMasca(): Promise<any> {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            const address = accounts[0];

            console.log(address);

          const enableResult = await enableMasca(address,
            {
              supportedMethods: ['did:key'],
              version: '1.2.2'
            }
          );

            if (isError(enableResult)) {
                console.error(enableResult)
            }

            const api = await enableResult.data.getMascaApi();

            const vcs = await api.queryCredentials({
                filter: {
                    type: 'JSONPath',
                    filter: query,
                },
                options: {
                    returnStore: true,
                },
            });

            if (vcs.success && vcs.data.length > 0) {
                vcs.data.sort(
                    (a, b) => Date.parse(b.data.issuanceDate) - Date.parse(a.data.issuanceDate));

                const presentation = await api.createPresentation({
                    vcs: [vcs.data[0].data],
                    proofFormat: 'EthereumEip712Signature2021'
                });

                if (presentation.data !== undefined) {
                    setVP(presentation.data)
                }
            } else {
                console.log(`Wallet loaded but no matching VCs. Success: ${vcs.success}, Query: ${query}`)
            }

            setWalletLoaded(true);
        } catch (error) {
            console.error(error);
            setMetaMaskFailed(true);
        }
    }

    useEffect(() => {
        healthCheck();
    }, []);

    useEffect(() => {
        if (backendHealthy) {
            assureMasca()
        }
    }, [backendHealthy]);

    return <div>
        <Head>
            <title>Camera Access | SDSR SSI</title>
        </Head>
        <div className="flex flex-col bg-gray-100">
            <InfoLinks />
            <TitlePurpose title="" purpose="" />
            {backendHealthy ? (
                <div>
                    {!metaMaskFailed ? (
                        <div>
                            {walletLoaded ? (
                                <div>
                                    {vp !== null ? (
                                        <CamerasView vp={vp} />
                                    ) : (
                                        <WarrningMessage message={noVPErrorMessage} />
                                    )}
                                </div>
                            ) : (
                                <Progress />
                            )}
                        </div>
                    ) : (
                        <WarrningMessage message={metaMaskErrorMessage} />
                    )}
                </div>
            ) : (
                <div>
                    <WarrningMessage message={backendErrorMessage} />
                </div>
            )}
        </div>
    </div>;
}

export default index;
