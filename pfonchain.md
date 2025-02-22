Based on the crypto trading behavior you're describing (pump and dump schemes), here are key characteristics you should consider for your ML model to distinguish legitimate trading from potential rug pulls:
Temporal Features

Buy clustering - Measure time density of buy transactions (many buys in a short timeframe from different wallets)
Holding period asymmetry - Compare average hold times across wallets (short for insiders, longer for victims)
Buy-sell pattern timing - Irregular timing patterns where many buys precede coordinated selling

Wallet Behavior

Wallet age - New wallets created just before trading activity
Transaction history - Wallets with similar patterns across multiple tokens
Wallet relationships - Graph-based features showing connections between wallets that trade together

Volume and Value Metrics

Buy-sell size imbalance - Smaller buys to pump followed by large sells
Price impact asymmetry - How much buys vs sells affect token price
Sell concentration - Percentage of total token supply sold within short timeframes

Example Features to Calculate
typescriptCopyinterface TokenTradingSignals {
  // Temporal features
  buy_transaction_density: number;        // Buys per minute during pump phase
  buy_sell_time_gap: number;              // Minutes between pump phase and dump phase
  wallet_coordination_score: number;      // Similarity in timing between different wallets
  
  // Volume features
  buy_sell_volume_ratio: number;          // Ratio of buy volume to sell volume
  avg_buy_size: number;                   // Average SOL amount per buy
  avg_sell_size: number;                  // Average SOL amount per sell
  largest_sells_percentage: number;       // % of total supply sold in top 5 sells
  
  // Wallet features
  unique_buyers_count: number;            // Count of unique buying wallets
  repeat_trader_ratio: number;            // % of wallets that both buy and sell
  wallet_network_density: number;         // Graph density of wallet transaction network
  
  // Pattern features
  initial_price_rise_rate: number;        // % price increase during first hour
  price_stability_duration: number;       // Minutes token holds >80% of peak price
  final_price_drop_rate: number;          // % price decrease during sell-off
}
To implement these in your current system, you'd need to:

Group transactions by token mint address
Calculate time-based metrics for buy clusters
Build wallet relationship graphs
Track price impacts of transactions
Measure concentration of selling activity

The most distinctive signal of rug pulls is typically the coordination pattern - multiple wallets buying in a synchronized manner to create artificial demand, followed by large sells from a small number of wallets once retail investors have entered.
Would you like me to elaborate on any particular category of features or suggest a specific implementation approach for your current codebase?RetryClaude does not have the ability to run the code it generates yet.