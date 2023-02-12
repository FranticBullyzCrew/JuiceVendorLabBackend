import { cronJobQueue, runningCustomers, validChannels } from "../config";
import { Request, Response } from "express";
import Farm from "../schemas/Farms";
import axios from "axios";
import { Connection, PublicKey } from "@solana/web3.js";
import Bottleneck from "bottleneck";
import { programs } from "@metaplex/js";

interface WalletToken {
  mintAddress: string;
  owner: string;
  supply: number;
  collection: string;
  name: string;
  updateAuthority: string;
  primarySaleHappened: number;
  sellerFeeBasisPoints: number;
  image: string;
  externalUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
}

const web3Connection = new Connection(
  "https://small-red-dew.solana-mainnet.quiknode.pro/a7a53c5e116e9196170c3ee6ddc1a150dd64cf9b/",
  "confirmed"
);

const limiter = new Bottleneck({
  minTime: 50,
  highWater: 40,
  strategy: Bottleneck.strategy.OVERFLOW,
});

class CustomerController {
  async getFarms(request: Request, response: Response) {
    const farms = await Farm.find({}, { name: 1, tokenName: 1, address: 1 });

    return response.status(200).send(farms);
  }

  async getFarm(request: Request, response: Response) {
    const farm = request.params.address;
    const farms = await Farm.findOne({ address: farm });
    return response.status(200).send(farms);
  }

  async getNFTs(request: Request, response: Response) {
    const publickey = request.params.publickey;
    const address = request.params.address;
    const beforeAll = new Date().getTime();

    const farms = await Farm.findOne({ address: address });
    if (!farms || !publickey) return response.status(400).send();
    try {
      const beforeMints = new Date().getTime();

      const walletMints = await getUserTokens(
        new PublicKey(publickey),
        JSON.parse(farms.mintList)
      );

      const before = new Date().getTime();

      console.log("fetching", walletMints.length, "nfts for", address);

      const userTokens = await Promise.all(
        walletMints.map(async (mint) => {
          try {
            const tokenMetaPubKey = await programs.metadata.Metadata.getPDA(
              mint
            );

            const tokenMeta = await programs.metadata.Metadata.load(
              web3Connection,
              tokenMetaPubKey
            );

            const uri = tokenMeta.data.data.uri;

            const { data } = await limiter.schedule({ expiration: 23000 }, () =>
              axios.get<any>(uri)
            );

            return {
              mintAddress: tokenMeta.data.mint,
              name: data.name,
              image: data.image,
              attributes: data.attributes,
              symbol: data.symbol,
            };
          } catch (error) {
            console.log("error fetching", mint);
          }
        })
      );

      console.log(
        "bottlenecked",
        address,
        new Date().getTime() - beforeAll,
        new Date().getTime() - beforeMints,
        new Date().getTime() - before,
        userTokens.length
      );

      return response.status(200).send(userTokens);
    } catch (e) {
      console.log(e);
      return response.status(400).send();
    }
  }

  async getUserStaked(request: Request, response: Response) {
    const publickey = request.params.publickey;
    const address = request.params.address;
    const farms = await Farm.findOne({ address: address });
    if (!farms || !publickey) return response.status(400).send();
    try {
      const walletMints = await getUserTokens(
        new PublicKey(publickey),
        JSON.parse(farms.mintList)
      );

      return response.status(200).send({ amount: walletMints.length });
    } catch (e) {
      console.log(e);
      return response.status(400).send();
    }
  }
}

async function getUserTokens(publicKey: PublicKey, mintList: string[]) {
  const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );

  const account = await web3Connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_PROGRAM_ID }
    // { encoding: "base64" }
  );

  const nfts = account.value.filter((token) => {
    if (
      token.account.data.parsed.info.tokenAmount.amount >= "1" &&
      mintList.includes(token.account.data.parsed.info.mint)
    ) {
      return true;
    }
    return false;
  });

  const mints = nfts.map((n) => {
    return n.account.data.parsed.info.mint;
  });

  return mints;
}

export default new CustomerController();
