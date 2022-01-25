import Nweet from "components/Nweet";
import { dbService, storageService } from "fbase";
import {v4 as uuidv4 } from "uuid"
import React, {useEffect, useState} from "react";

const Home = ({userObj}) => {
    const [nweet, setNweet] = useState("");
    const [nweets, setNweets] = useState([]);
    const [attachment, setAttachment] = useState("");
    // const getNweets = async () => {
    //     const dbNweets = await dbService.collection("nweets").get();
    //     dbNweets.forEach(document => {
    //         const nweetObject = {
    //             ...document.data(),
    //             id: document.id,
    //         }
    //         setNweets(prev => [nweetObject, ...prev]);
    //     });
    // }
    // 왜 위의 방법은 실시간이 아니고 아래의 방법은 실시간인가.
    // onSnapshot? 이라고 하기엔 메세지 하나 올릴 때마다 <Home /> 을
    // 호출하는 것 같은데... 둘 다 매번 실행되는 건 같은 거 같은데?

    useEffect(() => {
        // getNweets();
        // onSnapshot 은 기본적으로 DB 에 무슨 일이 있을 때 알림을 받음.(CRUD 전부)
        dbService.collection("nweets").onSnapshot(snapshot => {
            const nweetArray = snapshot.docs.map(
                doc => ({
                    id: doc.id,
                    ...doc.data(),
                }),
            );
            setNweets(nweetArray);
        });
    }, []);
    const onSubmit = async (event) => {
        event.preventDefault();
        let attachmentUrl = "";
        if (attachment !== "") {
            const attachmentRef = storageService.ref().child(`${userObj.uid}/${uuidv4()}`);
            const response = await attachmentRef.putString(attachment, "data_url");
            attachmentUrl = await response.ref.getDownloadURL();
        }
        const nweetObj = {
            text: nweet,
            createdAt: Date.now(),
            creatorId: userObj.uid,
            attachmentUrl,
        }

        // Texts
        await dbService.collection("nweets").add(nweetObj);
        setNweet("");
        setAttachment("");
    };
    const onChange = (event) => {
        const {target: {value}} = event;
        setNweet(value);
    };
    const onFileChange = (event) => {
        const {target: {files}} = event;
        const theFile = files[0];
        const reader = new FileReader();
        reader.onloadend = (finishedEvent) => {
            const {currentTarget: {result}} = finishedEvent;
            setAttachment(result);
        };
        reader.readAsDataURL(theFile);
    };
    const onClearAttachment = () => setAttachment(null);
    return (
        <div>
            <form onSubmit={onSubmit}>
                <input value={nweet} onChange={onChange} type="text"placeholder="What's on your mind?" maxLength={120} />
                <input type="file" accept="image/*" onChange={onFileChange} />
                <input type="submit" value="Nweet" />
                {attachment && (
                    <div>
                        <img src={attachment} width="50px" height="50px"/>
                        <button onClick={onClearAttachment}>Clear</button>
                    </div>
                )}
            </form>
            <div>
                {nweets.map(nweet =>
                    <Nweet key={nweet.id} nweetObj={nweet} isOwner={nweet.creatorId === userObj.uid} / >
                )}
            </div>
        </div>
    );
};
export default Home;