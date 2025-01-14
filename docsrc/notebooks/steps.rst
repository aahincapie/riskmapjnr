=========
All steps
=========




1 Introduction
--------------

1.1 Objective
~~~~~~~~~~~~~

We present here all the steps of the JNR methodology that need to be followed to derive a map of the deforestation risk in a given jurisdiction.

1.2 Importing Python modules
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We import the Python modules needed for running the analysis.

.. code:: python

    # Imports
    import os
    import pkg_resources

    import numpy as np
    import matplotlib.pyplot as plt
    import pandas as pd
    from tabulate import tabulate

    import riskmapjnr as rmj

Increase the cache for GDAL to increase computational speed.

.. code:: python

    # GDAL
    os.environ["GDAL_CACHEMAX"] = "1024"

Set the ``PROJ_LIB`` environmental variable.

.. code:: python

    os.environ["PROJ_LIB"] = "/home/ghislain/.pyenv/versions/miniconda3-latest/envs/conda-rmj/share/proj"

Create a directory to save results.

.. code:: python

    out_dir = "outputs_steps"
    rmj.make_dir(out_dir)

1.3 Forest cover change data
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We use the Guadeloupe archipelago as a case study. Recent forest cover change data for Guadeloupe is included in the ``riskmapjnr`` package. The raster file (``fcc123_GLP.tif``) includes the following values: **1** for deforestation on the period 2000--2010, **2** for deforestation on the period 2010--2020, and **3** for the remaining forest in 2020. NoData value is set to **0**. The first period (2000--2010) will be used for calibration and the second period (2010--2020) will be used for validation. This is the only data we need to derive a map of deforestation risk following the JNR methodology.

.. code:: python

    fcc_file = pkg_resources.resource_filename("riskmapjnr", "data/fcc123_GLP.tif")
    print(fcc_file)
    border_file = pkg_resources.resource_filename("riskmapjnr", "data/ctry_border_GLP.gpkg")
    print(border_file)

::

    /home/ghislain/Code/riskmapjnr/riskmapjnr/data/fcc123_GLP.tif
    /home/ghislain/Code/riskmapjnr/riskmapjnr/data/ctry_border_GLP.gpkg


We plot the forest cover change map with the ``plot.fcc123()`` function.

.. code:: python

    ofile = os.path.join(out_dir, "fcc123.png")
    fig_fcc123 = rmj.plot.fcc123(
        input_fcc_raster=fcc_file,
        maxpixels=1e8,
        output_file=ofile,
        borders=border_file,
        linewidth=0.2,
        figsize=(5, 4), dpi=800)
    ofile

.. _fig:steps-fccmap:

.. figure:: outputs_steps/fcc123.png
    :width: 600


    **Forest cover change map.** Deforestation on the first period (2000--2010) is in orange, deforestation on the second period (2000--2020) is in red and remaining forest (in 2020) is in green.

2 Deforestation risk and distance to forest edge
------------------------------------------------

The first step is to compute the distance to the forest edge after which the risk of deforestation becomes negligible. Indeed, it is known from previous studies on tropical deforestation that the deforestation risk decreases rapidly with the distance to the forest edge and that most of the deforestation occurs close to the forest edge (Vieilledent et al., 2013, Grinand et al., 2020, Vieilledent, 2021, Dezécache et al., 2017). The JNR methodology suggests identifying the distance to the forest edge :math:`d`, so that at least 99% of the deforestation occurs within a distance :math:`\leq d`. Forest areas located at a distance from the forest edge :math:`\gt d` can be considered as having no risk of being deforested. As a consequence, forest pixels with a distance from the forest edge :math:`\gt d` are assigned category 0 (zero) for the deforestation risk.

.. code:: python

    ofile = os.path.join(out_dir, "perc_dist.png")
    dist_edge_thres = rmj.dist_edge_threshold(
        fcc_file=fcc_file,
        defor_values=1,
        dist_file=os.path.join(out_dir, "dist_edge.tif"),
        dist_bins=np.arange(0, 1080, step=30),
        tab_file_dist=os.path.join(out_dir, "tab_dist.csv"),
        fig_file_dist=ofile,
        blk_rows=128, verbose=False)
    ofile

.. _fig:steps-dist_edge:

.. figure:: outputs_steps/perc_dist.png
    :width: 600


    **Identifying areas for which the risk of deforestation is negligible.** Figure shows that more than 99% of the deforestation occurs within a distance from the forest edge ≤ 120 m. Forest areas located at a distance > 120 m from the forest edge can be considered as having no risk of being deforested.

The function returns a dictionnary including the distance threshold.

.. code:: python

    dist_thresh = dist_edge_thres["dist_thresh"]
    print(f"The distance threshold is {dist_thresh} m")

::

    The distance threshold is 120 m


A table indicating the cumulative percentage of deforestation as a function of the distance is also produced:

.. table::

    +----------+---------+---------+------------+------------+
    | Distance | Npixels |    Area | Cumulation | Percentage |
    +==========+=========+=========+============+============+
    |       30 |   24937 | 2244.33 |    2244.33 |     83.583 |
    +----------+---------+---------+------------+------------+
    |       60 |    3451 |  310.59 |    2554.92 |      95.15 |
    +----------+---------+---------+------------+------------+
    |       90 |    1001 |   90.09 |    2645.01 |    98.5051 |
    +----------+---------+---------+------------+------------+
    |      120 |     282 |   25.38 |    2670.39 |    99.4503 |
    +----------+---------+---------+------------+------------+
    |      150 |     102 |    9.18 |    2679.57 |    99.7922 |
    +----------+---------+---------+------------+------------+
    |      180 |      29 |    2.61 |    2682.18 |    99.8894 |
    +----------+---------+---------+------------+------------+
    |      210 |      14 |    1.26 |    2683.44 |    99.9363 |
    +----------+---------+---------+------------+------------+
    |      240 |       6 |    0.54 |    2683.98 |    99.9564 |
    +----------+---------+---------+------------+------------+
    |      270 |       2 |    0.18 |    2684.16 |    99.9631 |
    +----------+---------+---------+------------+------------+
    |      300 |       3 |    0.27 |    2684.43 |    99.9732 |
    +----------+---------+---------+------------+------------+

3 Local deforestation rate
--------------------------

The second step is to compute a local risk of deforestation at the pixel level using a moving window made of several pixels. The deforestation risk is estimated from the deforestation rate inside the moving window. The deforestation rate :math:`\theta` (in %/yr) is computed from the formula :math:`\theta=(\alpha_2/\alpha_1)^{1/\tau}-1`, with :math:`\alpha` the forest areas (in ha) at time :math:`t_1` and :math:`t_2`, and :math:`\tau`, the time interval (in yr) between time :math:`t_1` and :math:`t_2`. Using the deforestation rate formula, the moving window and the past forest cover change map, we can derive a raster map describing the local risk of deforestation at the same resolution as the input map.

To save space on disk, deforestation rates are converted to integer values between 0 and 10000 (ten thousand) and the raster type is set to UInt16. This ensures a precision of 10\ :sup:`-4`\ for the deforestation rate which is sufficient to determine the 30 categories of deforestation risk, as imposed by the JNR methodology.

.. code:: python

    # Set window size
    s = 5
    # Compute local deforestation rate
    rmj.local_defor_rate(
        fcc_file=fcc_file,
        defor_values=1,
        ldefrate_file=os.path.join(out_dir, f"ldefrate.tif"),
        win_size=s,
        time_interval=10,
        blk_rows=100,
        verbose=False)

4 Pixels with zero risk of deforestation
----------------------------------------

This third step sets a value of 10001 to pixels with zero deforestation risk. As explained previously, a risk of deforestation of zero is assumed when distance to forest edge is greater than the distance below which more than 99% of the deforestation occurs.

.. code:: python

    rmj.set_defor_cat_zero(
        ldefrate_file=os.path.join(out_dir, f"ldefrate.tif"),
        dist_file=os.path.join(out_dir, "dist_edge.tif"),
        dist_thresh=dist_thresh,
        ldefrate_with_zero_file=os.path.join(out_dir, f"ldefrate_with_zero.tif"),
        blk_rows=128,
        verbose=False)

5 Categories of deforestation risk
----------------------------------

The fourth step implies converting the continuous values of the raster map of deforestation risk to categorical values. The JNR methodology suggests to use 31 classes of risk from “0” to “30” including the “0” class for the forest pixels with no risk of being deforested (located at a distance to the forest edge :math:`> d`, see first step). Following the JNR methodology, at least three slicing algorithms must be compared to derive the categorical map of deforestation risk, such as “equal area”, “equal interval”, and “natural breaks”. With the “equal area” algorithm, each class from “1” to “30” must cover approximately the same area. With the “equal interval” algorithm, classes from “1” to “30” correspond to bins of deforestation risk of the same range. In this case, some risk classes will be in majority in the landscape compared to other classes of lower frequency. With the “natural breaks” algorithm, the continuous deforestation risk is normalized before running an “equal interval” algorithm.

.. code:: python

    rmj.defor_cat(
        ldefrate_with_zero_file=os.path.join(out_dir, f"ldefrate_with_zero.tif"),
        riskmap_file=os.path.join(out_dir, "riskmap.tif"),
        ncat=30,
        method="Equal Interval",
        blk_rows=128,
        verbose=False)

The risk map can be plotted using the ``plot.riskmap()`` function.

.. code:: python

    ofile = os.path.join(out_dir, "riskmap.png")
    riskmap_fig = rmj.plot.riskmap(
        input_risk_map=os.path.join(out_dir, "riskmap.tif"),
        maxpixels=1e8,
        output_file=ofile,
        borders=border_file,
        legend=True,
        figsize=(5, 4), dpi=800,
        linewidth=0.2,)
    ofile

.. _fig:steps-riskmap:

.. figure:: outputs_steps/riskmap.png
    :width: 600


    **Map of the deforestation risk following the JNR methodology**. Forest pixels are categorized in up to 30 classes of deforestation risk. Forest pixels which belong to the class 0 (in green) are located farther than a distance of 120 m from the forest edge and have a negligible risk of being deforested.

6 Deforestation rates per category of risk
------------------------------------------

Before the validation step, we need to compute the historical deforestation rates (in %/yr) for each category of spatial deforestation risk. The historical deforestation rates are computed for the calibration period (here 2000--2010). Deforestation rates provide estimates of the percentage of forest (which is then converted to an area of forest) that should be deforested inside each forest pixel which belongs to a given category of deforestation risk.

.. code:: python

    rmj.defrate_per_cat(
        fcc_file=fcc_file,
        defor_values=1,
        riskmap_file=os.path.join(out_dir, "riskmap.tif"),
        time_interval=10,
        tab_file_defrate=os.path.join(out_dir, "defrate_per_cat.csv"),
        blk_rows=128,
        verbose=False)

A table indicating the deforestation rate per category of deforestation is produced:

.. table::

    +-----+--------+--------+---------------------+
    | cat |   nfor | ndefor |                rate |
    +=====+========+========+=====================+
    |   1 | 286897 |      0 |                 0.0 |
    +-----+--------+--------+---------------------+
    |   2 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   3 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   4 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   5 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   6 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   7 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   8 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |   9 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |  10 |      0 |      0 | \                   |
    +-----+--------+--------+---------------------+
    |  11 |   6948 |     97 | 0.13115645793568742 |
    +-----+--------+--------+---------------------+
    |  12 |   4555 |     83 | 0.16797929162030611 |
    +-----+--------+--------+---------------------+
    |  13 |   4428 |    102 |   0.207883556342903 |
    +-----+--------+--------+---------------------+
    |  14 |   4079 |    158 | 0.32635456697582377 |
    +-----+--------+--------+---------------------+
    |  15 |   3771 |    161 | 0.35359204117624776 |
    +-----+--------+--------+---------------------+
    |  16 |   1733 |    102 |  0.4548023398767944 |
    +-----+--------+--------+---------------------+
    |  17 |   2940 |    157 |  0.4223580050270457 |
    +-----+--------+--------+---------------------+
    |  18 |   4178 |    230 |   0.432341580700236 |
    +-----+--------+--------+---------------------+
    |  19 |   4028 |    262 | 0.48960250057719656 |
    +-----+--------+--------+---------------------+
    |  20 |   2401 |    182 |  0.5453769808930122 |
    +-----+--------+--------+---------------------+
    |  21 |   3654 |    317 |   0.596469248332768 |
    +-----+--------+--------+---------------------+
    |  22 |   1896 |    129 |  0.5057096122044651 |
    +-----+--------+--------+---------------------+
    |  23 |   4637 |    530 |  0.7029181842913952 |
    +-----+--------+--------+---------------------+
    |  24 |   3192 |    398 |  0.7359809944026328 |
    +-----+--------+--------+---------------------+
    |  25 |   2775 |    349 |  0.7392177123700654 |
    +-----+--------+--------+---------------------+
    |  26 |   5257 |    910 |  0.8505428722687592 |
    +-----+--------+--------+---------------------+
    |  27 |   3933 |    780 |  0.8903521189382809 |
    +-----+--------+--------+---------------------+
    |  28 |   4174 |    949 |  0.9241819269543683 |
    +-----+--------+--------+---------------------+
    |  29 |   6428 |   1870 |  0.9678645395136823 |
    +-----+--------+--------+---------------------+
    |  30 |  31671 |  21848 |  0.9999917619641472 |
    +-----+--------+--------+---------------------+

From this table, we see that the deforestation rate increases with the deforestation risk category and that deforestation rates are spread on the interval [0, 1], suggesting that category 1 represents well a category with very low deforestation risk (equal to 0), and category 30 represents well a category with very high deforestation risk (close to 1).

7 Validation
------------

The fifth step focuses on comparing the map of deforestation risk with a deforestation map corresponding to the validation period. The validation period follows the calibration period and provides independent observations of deforestation.

To do so, we consider a square grid of at least 1000 spatial cells containing at least one forest pixel at the beginning of the validation period. Following JNR specification, the cell size should be :math:`\leq` 10 km. Note that with the map of deforestation risk, each forest pixel at the beginning of the validation period falls into a category of deforestation risk. For each cell of the grid, we compute the predicted area of deforestation (in ha) given the map of deforestation risk and the historical deforestation rates for each category of deforestation risk computed on the calibration period (see previous step).

We can then compare the predicted deforestation with the observed deforestation in that spatial cell for the validation period. Because all cells don’t have the same forest cover at the beginning of the validation period, a weight :math:`w_j` is computed for each grid cell :math:`j` such that :math:`w_j=\beta_j / B`, with :math:`\beta_j` the forest cover (in ha) in the cell :math:`j` at the beginning of the validation period and :math:`B` the total forest cover in the jurisdiction (in ha) at the same date. We then calculate the weighted root mean squared error (wRMSE) from the observed and predicted deforestation for each cell and the cell weights.

.. code:: python

    ofile = os.path.join(out_dir, "pred_obs.png")
    rmj.validation(
        fcc_file=fcc_file,
        time_interval=10,
        riskmap_file=os.path.join(out_dir, "riskmap.tif"),
        tab_file_defrate=os.path.join(out_dir, "defrate_per_cat.csv"),
        csize=40,
        tab_file_pred=os.path.join(out_dir, "pred_obs.csv"),
        fig_file_pred=ofile,
        figsize=(6.4, 4.8),
        dpi=100, verbose=False)
    ofile

.. _fig:steps-pred_obs:

.. figure:: outputs_steps/pred_obs.png
    :width: 600


    **Relationship between observed and predicted deforestation in 1 x 1 km grid cells**. The red line is the identity line. Values of the weighted root mean squared error (wRMSE, in ha) and of the number of observations (:math:`n`, the number of spatial cells) are reported on the graph.

8 Final risk map
----------------

The user must repeat the procedure and obtain risk maps for various window size and slicing algorithms. Following the JNR methodology, at least 25 different sizes for the moving window must be tested together with two slicing algorithms (“Equal Interval” and “Equal Area”), thus leading to a minimum of 50 different maps of deforestation risk. The map with the smallest wRMSE value is considered the best risk map. Once the best risk map is identified, with the corresponding window size and slicing algorithm, a final risk map is derived considering both the calibration and validation period (see the `Get Started <https://ecology.ghislainv.fr/riskmapjnr/notebooks/get_started.html>`_ tutorial).
