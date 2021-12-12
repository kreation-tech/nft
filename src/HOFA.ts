/* eslint-disable block-spacing */
/* eslint-disable brace-style */
/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▒▀█░█▀░▒█▒
 *
 * Made with 🧡 by www.Kreation.tech
 */

import { Provider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";
// eslint-disable-next-line camelcase
import { HofaNFT__factory } from "../src/types";
import type { HofaNFT } from "../src/types";
import addresses from "./addresses.json";
import crypto from "crypto";
import { BigNumberish } from "@ethersproject/bignumber";

export class HOFA {
	private signerOrProvider: Signer | Provider;
	public impl: HofaNFT;

    constructor(signerOrProvider: Signer | Provider, factoryAddressOrChainId: string | number) {
		this.signerOrProvider = signerOrProvider;
		if (typeof (factoryAddressOrChainId) !== "string") {
			const contracts:{[key: string]: string} = (addresses as {[key: string]: {[name: string]: string}})[factoryAddressOrChainId.toString()];
			if (!contracts) throw new Error("Unknown chain with id " + factoryAddressOrChainId);
			this.impl = HofaNFT__factory.connect(contracts.HofaNFT, signerOrProvider);
		} else {
			this.impl = HofaNFT__factory.connect(factoryAddressOrChainId as string, signerOrProvider);
		}
	}

	public static async getChainId(signerOrProvider: Signer | Provider): Promise<number> {
		return new Promise((resolve, reject) => {
			const chainId = (signerOrProvider as Signer).getChainId();
			if (chainId === undefined) {
				(signerOrProvider as Provider).getNetwork().then(network => {
					resolve(network.chainId);
				});
			}
			resolve(chainId);
		});
	}

	public async mint(uri:string, hash:string, royalties?:number, confirmations:number = 1): Promise<number> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await (await this.impl.mint(uri, hash, royalties || 0))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "Transfer") {
						resolve(log.args![2]);
					}
				}
			} catch (err) {
				reject(err);
			}
		})();});
	}

	public async approve(to:string, tokenId:BigNumberish, confirmations:number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.impl.approve(to, tokenId).then((tx) => {
				tx.wait(confirmations).then((receipt) => {
					resolve(true);
				});
			});
		});
	}

	public async grantArtist(artist:string, confirmations:number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await (await this.impl.grantRole(await this.impl.MINTER_ROLE(), artist))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "RoleGranted") {
						resolve(true);
					}
				}
				resolve(false);
			} catch (err) {
				reject(err);
			}
		})();});
	}

	public async revokeArtist(artist:string, confirmations:number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await (await this.impl.revokeRole(await this.impl.MINTER_ROLE(), artist))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "RoleRevoked") {
						resolve(true);
					}
				}
				resolve(false);
			} catch (err) {
				reject(err);
			}
		})();});
	}

	public static hash(buffer:Buffer): string {
		const hashHex = crypto.createHash("sha256").update(buffer.toString()).digest("hex");
		return "0x".concat(hashHex.toString());
	}

	public async metadata(title:string, description:string, uri:string, hash:string): Promise<string> {
		return new Promise((resolve, reject) => {
			(this.signerOrProvider as Signer).getAddress().then((address) => {
				const metadata = {
					name: title,
					description: description,
					image: uri,
					properties: {
						creator: address,
						sha256: hash
					}
				};
				resolve(JSON.stringify(metadata));
			});
		});
	}
}
