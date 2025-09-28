import NonFungibleToken from 0x631e88ae7f1d7c20

pub contract AudioNFT: NonFungibleToken {
    
    pub var totalSupply: UInt64
    
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event AudioNFTMinted(id: UInt64, ipfsCID: String, metadata: {String: String})
    
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath
    
    pub resource NFT: NonFungibleToken.INFT {
        pub let id: UInt64
        pub let ipfsCID: String
        pub let metadata: {String: String}
        
        init(id: UInt64, ipfsCID: String, metadata: {String: String}) {
            self.id = id
            self.ipfsCID = ipfsCID
            self.metadata = metadata
        }
    }
    
    pub resource interface AudioNFTCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowAudioNFT(id: UInt64): &AudioNFT.NFT? {
            post {
                (result == nil) || (result?.id == id): 
                    "Cannot borrow AudioNFT reference: The ID of the returned reference is incorrect"
            }
        }
    }
    
    pub resource Collection: AudioNFTCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        
        init() {
            self.ownedNFTs <- {}
        }
        
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }
        
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @AudioNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }
        
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }
        
        pub fun borrowAudioNFT(id: UInt64): &AudioNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
                return ref as! &AudioNFT.NFT
            } else {
                return nil
            }
        }
        
        destroy() {
            destroy self.ownedNFTs
        }
    }
    
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }
    
    pub resource NFTMinter {
        pub fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, ipfsCID: String, metadata: {String: String}): UInt64 {
            let newNFT <- create NFT(id: AudioNFT.totalSupply, ipfsCID: ipfsCID, metadata: metadata)
            let id = newNFT.id
            
            emit AudioNFTMinted(id: id, ipfsCID: ipfsCID, metadata: metadata)
            
            recipient.deposit(token: <-newNFT)
            
            AudioNFT.totalSupply = AudioNFT.totalSupply + 1
            
            return id
        }
    }
    
    init() {
        self.totalSupply = 0
        
        self.CollectionStoragePath = /storage/AudioNFTCollection
        self.CollectionPublicPath = /public/AudioNFTCollection
        self.MinterStoragePath = /storage/AudioNFTMinter
        
        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)
        
        let collection <- self.createEmptyCollection()
        self.account.save(<-collection, to: self.CollectionStoragePath)
        self.account.link<&AudioNFT.Collection{NonFungibleToken.CollectionPublic, AudioNFT.AudioNFTCollectionPublic}>(
            self.CollectionPublicPath, 
            target: self.CollectionStoragePath
        )
        
        emit ContractInitialized()
    }
}
