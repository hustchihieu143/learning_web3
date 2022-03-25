/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
	Alert,
	Badge,
	Button,
	Card,
	CardBody,
	CardHeader,
	Col,
	Container,
	ListGroup,
	ListGroupItem,
	Row,
	Spinner,
} from "reactstrap";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import ConnectWallet from "features/connectWallet";
import { useEagerConnect, useInactiveListener } from "hooks/listener";
import {
	getContractDD2,
	getContractMasterChef,
	getContractWETH,
} from "functions/contract";
import { CHAIN_LIST, SC_MasterChef } from "utils/connect";
import { KEY } from "utils/const";
import PopupAction from "features/popupAction";
import { formatAmount, formatAmountDD2 } from "functions/format";
import { formatEther, parseEther, parseUnits } from "@ethersproject/units";

function Message({ setting }) {
	const { show, key, msg } = setting;
	return (
		show && (
			<Alert color={key === KEY.SUCCESS ? "success" : "danger"}>{msg}</Alert>
		)
	);
}

function PopupStake(props) {
	return <PopupAction title="Stake" {...props} currency="WETH" />;
}

function PopupWithdraw(props) {
	return <PopupAction title="Withdraw" {...props} currency="DD2" />;
}

function Stake(props) {
	const { chainId, library, account, deactivate, connector } = useWeb3React();
	const [isApprove, setIsApprove] = useState(false);
	const [msg, setMsg] = useState({
		show: false,
		type: null,
		msg: "",
	});
	const clearBigNumber = BigNumber.from(0);
	const [balanceWETH, setBalanceWETH] = useState(clearBigNumber);
	const [pendingDD2, setPeddingDD2] = useState(clearBigNumber);
	const [balanceDD2, setBalanceDD2] = useState(clearBigNumber);
	const [totalDD2, setTotalDD2] = useState(clearBigNumber);
	// Loading
	const [harvesting, setHarvesting] = useState(false);
	const [approving, setApproving] = useState(false);
	const [staking, setStaking] = useState(false);
	const [withdrawing, setWithdrawing] = useState(false);
	// Popup
	const [showStake, setShowStake] = useState(false);
	const [showWithdraw, setShowWithdraw] = useState(false);

	// handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
	const triedEager = useEagerConnect();

	// handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
	useInactiveListener(!triedEager);

	// App
	const showMessage = (key, content) => {
		setMsg({
			...msg,
			show: true,
			key,
			msg: content,
		});

		setTimeout(() => {
			setMsg({
				...msg,
				show: false,
			});
		}, 4000);
	};
	const showMessageSuccess = (content) => {
		showMessage(KEY.SUCCESS, content);
	};
	const showMessageError = (content) => {
		showMessage(KEY.ERROR, content);
	};

	//
	const getBalanceWETH = async () => {
		const myContract = getContractWETH(library);
		const balance = await myContract.balanceOf(account);
		return balance;
	};
	const getPendingDD2 = async () => {
		const myContract = getContractMasterChef(library);
		const pendding = await myContract.pendingDD2(account);
		return pendding;
	};
	const getBalanceDD2 = async () => {
		const myContract = getContractDD2(library);
		const balance = await myContract.balanceOf(account);
		return balance;
	};
	const getTotalDD2 = async () => {
		const myContract = getContractDD2(library);
		const balance = await myContract.totalSupply();
		return balance;
	};
	const onClickHarvest = async () => {
		setHarvesting(true);
		const myContract = getContractMasterChef(library);
		await myContract
			.withdraw(0)
			.then(async (res) => {
				await res.wait();
				setHarvesting(false);
				showMessageSuccess("Harvest success !");
			})
			.catch((err) => {
				showMessageError(err.stack);
				setHarvesting(false);
			});
	};
	const renderAccount = () => {
		return account ? account.slice(0, 6) + "..." + account.slice(-4) : "";
	};

	// Init
	const stateUpdate = harvesting && approving && staking && withdrawing;
	// Updating
	useEffect(() => {
		(async function () {
			//
			if (
				// Init app
				(library && !stateUpdate) ||
				// Or updated
				stateUpdate
			) {
				Promise.all([
					getPendingDD2(),
					getBalanceDD2(),
					getTotalDD2(),
					getBalanceWETH(),
				]).then((res) => {
					setPeddingDD2(res[0]);
					setBalanceDD2(res[1]);
					setTotalDD2(res[2]);
					setBalanceWETH(res[3]);
				});
			}
			if (!account) {
				setPeddingDD2(clearBigNumber);
				setBalanceDD2(clearBigNumber);
				setTotalDD2(clearBigNumber);
				setBalanceWETH(clearBigNumber);
			}
		})();
	}, [account, library, chainId, harvesting, approving, staking, withdrawing]);

	// ACTION
	const onClickApprove = async (e) => {
		// UI
		setApproving(true);
		// Call
		const myContract = getContractWETH(library);
		// Sent
		myContract
			.approve(SC_MasterChef, balanceWETH.toString())
			.then(async (res) => {
				await res.wait();
				showMessageSuccess("Approve success !");
				setIsApprove(true);
				setApproving(false);
			})
			.catch((err) => {
				showMessageError(err.stack);
				setApproving(false);
			});
	};
	const toggleStake = () => {
		setShowStake(!showStake);
	};
	const toggleWithdraw = () => {
		setShowWithdraw(!showWithdraw);
	};
	const onSubmitStake = async (value) => {
		if (value <= balanceWETH.toString()) {
			// UI
			setStaking(true);
			setShowStake(false);
			// Call
			const myContract = getContractMasterChef(library);

			myContract
				.deposit(parseUnits(value, 18))
				.then(async (res) => {
					await res.wait();
					showMessageSuccess("Stake success !");
					setStaking(false);
				})
				.catch((err) => {
					showMessageError(err.stack);
					setStaking(false);
				});
		}
	};
	const onSubmitWithdraw = async (value) => {
		if (value <= balanceDD2.toString()) {
			// UI
			setWithdrawing(true);
			setShowWithdraw(false);
			// Call
			const myContract = getContractMasterChef(library);

			myContract
				.withdraw(parseUnits(value, 18))
				.then(async (res) => {
					await res.wait();
					showMessageSuccess("Withdraw WETH success !");
					setWithdrawing(false);
				})
				.catch((err) => {
					showMessageError(err.stack);
					setWithdrawing(false);
				});
		}
	};

	return (
		<Container>
			<Message setting={msg} />
			<Card>
				<CardHeader>
					<Row className="justify-content-between align-items-center">
						<Col>
							<b>Stake token</b>
						</Col>
						<Col className="text-right">{!account && <ConnectWallet />}</Col>
					</Row>
				</CardHeader>
				<CardBody>
					<Row>
						<Col sm={12}>
							Wallet address: <b>{renderAccount()}</b>
							{account && (
								<Badge
									href="#"
									color="danger"
									className="ml-2"
									onClick={() => {
										deactivate();
									}}
								>
									Logout
								</Badge>
							)}
						</Col>
						<Col className="mt-2">
							Network: <b>{CHAIN_LIST[chainId]}</b>
						</Col>
					</Row>
					<Row className="mt-2">
						<Col sm={12}>
							Balance:{" "}
							<b>{formatAmount.format(formatEther(balanceWETH))} WETH</b>
						</Col>
					</Row>
					<Row className="justify-content-between align-items-center">
						<Col>
							Token earned:{" "}
							<b>{formatAmount.format(formatEther(pendingDD2))} DD2</b>
						</Col>
						<Col className="text-sm-right" sm="4" xs={12}>
							<Button
								color="success"
								onClick={onClickHarvest}
								disabled={harvesting || !account}
							>
								Harvest {harvesting && <Spinner size="sm" color="light" />}
							</Button>
						</Col>
					</Row>
					<Row className="mt-3">
						{!isApprove ? (
							<Col>
								<Button
									size="lg"
									color="primary"
									block
									onClick={onClickApprove}
									disabled={approving || !account}
								>
									Approve {approving && <Spinner size="sm" color="light" />}
								</Button>
							</Col>
						) : (
							<>
								<Col>
									<Button
										size="lg"
										className="w-100"
										color="primary"
										onClick={toggleStake}
										disabled={staking}
									>
										Stake {staking && <Spinner size="sm" color="light" />}
									</Button>
								</Col>
								<Col>
									<Button
										size="lg"
										className="w-100"
										onClick={toggleWithdraw}
										disabled={withdrawing}
									>
										Withdraw{" "}
										{withdrawing && <Spinner size="sm" color="light" />}
									</Button>
								</Col>
							</>
						)}
					</Row>
					{/*  */}
					<ListGroup className="mt-3" horizontal>
						<ListGroupItem action>Share of pool</ListGroupItem>
						<ListGroupItem action>
							{!totalDD2.eq(0)
								? Math.round(
										(Number(balanceDD2.toString()) /
											Number(totalDD2.toString())) *
											100
								  ) + " %"
								: "0 %"}
						</ListGroupItem>
					</ListGroup>
					<ListGroup className="mt-3" horizontal>
						<ListGroupItem action>Your stake</ListGroupItem>
						<ListGroupItem action>
							{`${formatAmountDD2.format(formatEther(balanceDD2))} Token`}
						</ListGroupItem>
					</ListGroup>
					<ListGroup className="mt-3" horizontal>
						<ListGroupItem action>Total stake</ListGroupItem>
						<ListGroupItem action>
							{`${formatAmountDD2.format(formatEther(totalDD2))} Token`}
						</ListGroupItem>
					</ListGroup>
				</CardBody>
			</Card>

			{/* Popup */}
			<PopupStake
				show={showStake}
				balance={formatEther(balanceWETH)}
				onToggle={toggleStake}
				onSubmit={onSubmitStake}
			/>
			<PopupWithdraw
				show={showWithdraw}
				balance={formatEther(pendingDD2)}
				onToggle={toggleWithdraw}
				onSubmit={onSubmitWithdraw}
			/>
		</Container>
	);
}

Stake.propTypes = {};

export default Stake;
