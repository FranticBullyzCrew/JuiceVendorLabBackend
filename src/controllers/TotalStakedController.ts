import { cronJobQueue, runningCustomers, validChannels } from "../config";
import { Request, Response } from "express";
import Farm from "../schemas/Farms";
import axios from "axios";
import { Connection, PublicKey } from "@solana/web3.js";
import TotalStaked, { ITotalStaked } from "../schemas/TotalStaked";
import bs58 from "bs58";

const web3Connection = new Connection(
  "https://small-red-dew.solana-mainnet.quiknode.pro/a7a53c5e116e9196170c3ee6ddc1a150dd64cf9b/",
  "confirmed"
);

class TotalStakedController {
  async getTotalStaked(request: Request, response: Response) {
    const address = request.params.address;

    try {
      const obj = await TotalStaked.findOne({ address });

      if (!obj || obj.updatedAt.getTime() + 1000000 < new Date().getTime()) {
        // if not created or passed 30 minutes

        response.status(200).send({ totalStaked: obj?.totalStaked || 0 });
        console.log("response sent");
        await updateTotalStaked(address, obj);
        return;
      } else {
        console.log("cached");
        return response.status(200).send({ totalStaked: obj.totalStaked });
      }
    } catch (e) {
      return response.status(500).send();
    }
  }
}

async function updateTotalStaked(
  address: string,
  obj:
    | (ITotalStaked & {
        _id: any;
      })
    | null
) {
  console.log("refetching", address);
  const value = await fetchTotalStaked(address);
  console.log("refetched", address, value);

  if (!obj) {
    await TotalStaked.create({ address, totalStaked: value });
  } else {
    await TotalStaked.updateOne(
      { _id: obj._id },
      { totalStaked: value, updatedAt: new Date() },
      { upsert: true }
    );
  }

  console.log("updated");
}

async function fetchTotalStaked(address: string) {
  let allWallets = [];

  const farm_id = new PublicKey("2yYDX8THp9hLM6YfTrhRUUSWtWJM9b87uEwCuFAXv26y");
  const bank_id = new PublicKey("HH3mNHoxYP8riakmQMcYhGaY4ToXzyrt14Kiit4JK9S");
  let nfts = [];

  let result: any[] = [];
  let invalidOwners = [];

  const publicKey = new PublicKey(address);

  let farmerDiscriminator = {
    memcmp: {
      offset: 0,
      bytes: bs58.encode([254, 63, 81, 98, 130, 38, 28, 219]),
    },
  };
  let farmFilter = {
    memcmp: {
      offset: 8,
      bytes: address,
    },
  };

  try {
    const metadataAccounts = await web3Connection.getProgramAccounts(farm_id, {
      filters: [farmerDiscriminator, farmFilter],
    });

    const vaults = metadataAccounts.map((account) => {
      return bs58.encode(account.account.data.slice(72, 104));
    });
    let discriminator = {
      memcmp: {
        offset: 0,
        bytes: [214, 174, 90, 58, 243, 162, 24, 187],
      },
    };

    await Promise.all(
      metadataAccounts.map(async (account) => {
        let vaultFilter = {
          memcmp: {
            offset: 8,
            bytes: bs58.encode(account.account.data.slice(72, 104)),
          },
        };

        // console.log(bs58.encode(account.account.data.slice(72, 104)))

        const gdrs = await web3Connection.getProgramAccounts(bank_id, {
          //@ts-ignore
          filters: [discriminator, vaultFilter],
        });

        const newNfts = gdrs.map((gdr) => {
          return bs58.encode(gdr.account.data.slice(72, 104));
        });

        // if (newNfts.length > 0) {
        //   invalidOwners.push(await getNFTOwner(newNfts[0]))
        //   result[bs58.encode(account.account.data.slice(40, 72))] = newNfts;
        // }

        result = result.concat(newNfts);
      })
    );
  } catch (e) {
    console.log(e);
    return 0;
  }

  return result.length;
}

export default new TotalStakedController();
