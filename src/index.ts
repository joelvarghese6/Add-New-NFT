import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"

const tokenName = "Mythria"
const description = "nft of a character in fyodor dostosky's book"
const symbol = "MYT"
const sellerFeeBasisPoints = 100
const imageFile = "nft2.jpg"

async function updateNft(
  metaplex: Metaplex,
  uri: string,
  mintAddress: PublicKey
) {
  // get "NftWithToken" type from mint address
  const nft = await metaplex.nfts().findByMint({ mintAddress })

  // omit any fields to keep unchanged
  await metaplex
    .nfts()
    .update({
      nftOrSft: nft,
      name: tokenName,
      symbol: symbol,
      uri: uri,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
    })

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )
}


async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )

  const buffer = fs.readFileSync("src/" + imageFile)
  const file = toMetaplexFile(buffer, imageFile)
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: tokenName,
      description: description,
      image: imageUri,
    })

  console.log("metadata uri:", uri)

  const mintAddress = new PublicKey("2H5SszYWoAemFLjqfFbe4r1AGFzxvWsAkWdq1ZbstUct")
  await updateNft(metaplex, uri, mintAddress)


  // const { nft } = await metaplex
  //   .nfts()
  //   .create({
  //     uri: uri,
  //     name: tokenName,
  //     sellerFeeBasisPoints: sellerFeeBasisPoints,
  //     symbol: symbol,
  //   },
  //   { commitment: "finalized" })

  // console.log(
  //   `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  // )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
